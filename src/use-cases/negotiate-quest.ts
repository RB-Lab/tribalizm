import { ContextUser } from './utils/context-user'
import { IndeclinableError, QuestStatus, QuestType } from './entities/quest'
import { getBestFreeMember } from './utils/members-utils'
import { getRootIdea, NoIdeaError } from './utils/get-root-idea'
import { Message } from './utils/message'
import { QuestMessage } from './utils/quest-message'
import { HowWasQuestTask } from './utils/scheduler'

export class QuestNegotiation extends ContextUser {
    proposeChange = async (req: QuestChangeRequest) => {
        const quest = await this.getQuest(req.questId)
        const targetMembers = quest.propose(req.time, req.place, req.memberId)
        await this.stores.questStore.save(quest)
        targetMembers.forEach((targetMemberId) => {
            this.notify<QuestChangeMessage>({
                type: 'quest-change-proposed',
                payload: {
                    ...quest,
                    proposingMemberId: req.memberId,
                    questId: quest.id,
                    targetMemberId,
                },
            })
        })
    }
    acceptQuest = async (req: QuestAcceptRequest) => {
        const quest = await this.getQuest(req.questId)
        const targetMembers = quest.accept(req.memberId)
        await this.stores.questStore.save(quest)
        if (quest.status === QuestStatus.accepted) {
            targetMembers.forEach((targetMemberId) => {
                this.notify<QuestAcceptedMessage>({
                    type: 'quest-accepted',
                    payload: {
                        ...quest,
                        questId: quest.id,
                        targetMemberId,
                    },
                })
            })
            const after = quest.type === QuestType.coordination ? 5 : 2
            this.scheduler.schedule<HowWasQuestTask>({
                type: 'how-was-quest',
                done: false,
                time: quest.time + after * 3_600_000,
                payload: { questId: quest.id },
            })
        }
    }

    declineQuest = async (req: QuestDeclineRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.decline(req.memberId)
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

        this.notify<QuestMessage>({
            type: 'new-quest-message',
            payload: {
                ...quest,
                targetMemberId: nextMember.id,
                questId: quest.id,
            },
        })
    }
}

export interface QuestChangeMessage extends Message {
    type: 'quest-change-proposed'
    payload: {
        description: string
        questId: string
        proposingMemberId: string
        targetMemberId: string
        time: number
        place: string
    }
}

export interface QuestAcceptedMessage extends Message {
    type: 'quest-accepted'
    payload: {
        description: string
        questId: string
        targetMemberId: string
        time: number
        place: string
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
