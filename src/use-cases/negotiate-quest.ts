import { ContextUser } from './utils/context-user'
import {
    IndeclinableError,
    isCoordinationQuest,
    QuestIncompleteError,
    QuestStatus,
    QuestType,
} from './entities/quest'
import { getBestFreeMember } from './utils/members-utils'
import { getRootIdea, NoIdeaError } from './utils/get-root-idea'
import { Message } from './utils/message'
import { NewCoordinationQuestMessage } from './spawn-quest'
import { HowWasQuestTask } from './utils/scheduler'

export class QuestNegotiation extends ContextUser {
    proposeChange = async (req: QuestChangeRequest) => {
        const quest = await this.getQuest(req.questId)
        const member = await this.getMember(req.memberId)
        const user = await this.getUser(member.userId)
        const tribe = await this.getTribe(member.tribeId)
        const targetMembers = quest.propose(req.time, req.place, req.memberId)
        await this.stores.questStore.save(quest)
        const elderPatch =
            tribe.shamanId === member.id
                ? { elder: 'shaman' as 'shaman' }
                : tribe.chiefId === member.id
                ? { elder: 'chief' as 'chief' }
                : {}
        for (let targetMemberId of targetMembers) {
            const targetMember = await this.getMember(targetMemberId)
            this.notify<QuestChangeMessage>({
                type: 'quest-change-proposed',
                payload: {
                    targetMemberId,
                    targetUserId: targetMember.userId,
                    questId: quest.id,
                    questType: quest.type,
                    description: isCoordinationQuest(quest)
                        ? quest.description
                        : undefined,
                    time: req.time,
                    place: req.place,
                    proposingMemberId: req.memberId,
                    proposingMemberName: user.name,
                    tribe: tribe.name,
                    ...elderPatch,
                },
            })
        }
    }
    acceptQuest = async (req: QuestAcceptRequest) => {
        const quest = await this.getQuest(req.questId)
        const targetMemberIds = quest.accept(req.memberId)
        await this.stores.questStore.save(quest)
        if (!quest.place || !quest.time) {
            throw new QuestIncompleteError(
                `Cannot accept incomplete quest, time ${quest.time}, place: ${quest.place}`
            )
        }
        const members = await this.stores.memberStore.find({
            id: targetMemberIds,
        })

        if (quest.status === QuestStatus.accepted) {
            const memberViews = await this.getMembersViews(quest.memberIds)
            members.forEach((member) => {
                this.notify<QuestAcceptedMessage>({
                    type: 'quest-accepted',
                    payload: {
                        targetMemberId: member.id,
                        description: isCoordinationQuest(quest)
                            ? quest.description
                            : undefined,
                        targetUserId: member.userId,
                        members: memberViews,
                        // checked above
                        time: quest.time!,
                        place: quest.place!,
                        questId: quest.id,
                    },
                })
                if (quest.type === QuestType.coordination) {
                    this.notify<CoordinationQuestAcceptedMessage>({
                        type: 'coordination-quest-accepted',
                        payload: {
                            questId: quest.id,
                            targetMemberId: member.id,
                            targetUserId: member.userId,
                            members: memberViews,
                        },
                    })
                }
            })
            const after = quest.type === QuestType.coordination ? 5 : 2
            this.scheduler.schedule<HowWasQuestTask>({
                type: 'how-was-quest',
                done: false,
                time: quest.time + after * 3_600_000,
                payload: { questId: quest.id, questType: quest.type },
            })
        }
    }

    /**
     * Declines _coordination_ quest and assigns it to another suitable member
     */
    declineQuest = async (req: QuestDeclineRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.decline(req.memberId)
        // TODO should be possible also decline introduction quests
        if (!isCoordinationQuest(quest)) {
            throw new IndeclinableError(
                `Cannot re-spawn non-coordination quest ${quest.id} (${quest.type})`
            )
        }
        let ideaId: string
        if (quest.parentQuestId) {
            ideaId = await getRootIdea(
                this.stores.questStore,
                quest.parentQuestId
            )
        } else if (quest.ideaId) {
            ideaId = quest.ideaId
        } else {
            throw new NoIdeaError(
                `Quest ${req.questId} doesnt have the idea associated with it`
            )
        }
        const idea = await this.getIdea(ideaId)
        if (idea.meberId === req.memberId && !quest.parentQuestId) {
            throw new IndeclinableError(
                'You cannot decline quest created from your own idea'
            )
        }
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.meberId]
        const activeQuests = await this.stores.questStore.getActiveQuestsCount(
            memberIds
        )
        const members = await this.stores.memberStore.find({
            id: memberIds,
        })
        const first = members.find(
            (m) => m.id != req.memberId && quest.memberIds.includes(m.id)
        )
        if (!first) {
            throw new Error('Cannot find other members among upvoters')
        }

        const nextMember = getBestFreeMember(
            members,
            first.charisma > first.wisdom ? 'wisdom' : 'charisma',
            activeQuests,
            [first.id, req.memberId]
        )
        quest.addAssignee(nextMember.id)
        await this.stores.questStore.save(quest)
        const membersView = await this.getMembersViews(members)

        this.notify<NewCoordinationQuestMessage>({
            type: 'new-coordination-quest-message',
            payload: {
                description: quest.description,
                questId: quest.id,
                targetMemberId: nextMember.id,
                targetUserId: nextMember.userId,
                members: membersView.filter((mv) =>
                    quest.memberIds.includes(mv.id)
                ),
            },
        })
    }

    questDetails = async (req: { questId: string }) => {
        const quest = await this.getQuest(req.questId)

        const membersView = await this.getMembersViews(quest.memberIds)
        return {
            id: quest.id,
            type: quest.type,
            description: isCoordinationQuest(quest)
                ? quest.description
                : undefined,
            participants: membersView,
        }
    }
}

export interface QuestChangeMessage extends Message {
    type: 'quest-change-proposed'
    payload: {
        targetMemberId: string
        targetUserId: string
        questId: string
        description?: string
        time: number
        place: string
        tribe: string
        proposingMemberId: string
        proposingMemberName: string
        questType: QuestType
        elder?: 'chief' | 'shaman'
    }
}

export interface QuestAcceptedMessage extends Message {
    type: 'quest-accepted'
    payload: {
        description?: string
        questId: string
        targetMemberId: string
        targetUserId: string
        members: Array<{ name: string; id: string }>
        time: number
        place: string
    }
}

export interface CoordinationQuestAcceptedMessage extends Message {
    type: 'coordination-quest-accepted'
    payload: {
        questId: string
        targetMemberId: string
        targetUserId: string
        members: Array<{ name: string; id: string }>
    }
}

export interface QuestChangeRequest extends QuestNegotiationRequest {
    time: number
    place: string
}
export interface QuestNegotiationRequest {
    questId: string
    memberId: string
}

export interface QuestAcceptRequest extends QuestNegotiationRequest {}
export interface QuestDeclineRequest extends QuestNegotiationRequest {}
