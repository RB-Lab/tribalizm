import { mapify } from '../ts-utils'
import { isIntroductionQuest } from './entities/quest'
import { Storable } from './entities/store'
import { ContextUser } from './utils/context-user'
import { findMaxTrait } from './utils/members-utils'
import { Message } from './utils/message'
import { HowWasQuestTask, IntroductionTask } from './utils/scheduler'

export class QuestFinale extends ContextUser {
    finalize = async (req: QuestFinaleRequest) => {
        const quest = await this.getQuest(req.questId)
        const member = await this.getQuestMemberByUserId(quest, req.userId)
        quest.finish(member.id)
        // TODO BEGIN transaction
        // TODO 🤔 this looks like it doesn't belong here...
        if (isIntroductionQuest(quest) && member.id === quest.newMemberId) {
            const allMembers = await this.stores.memberStore.find({
                tribeId: member.tribeId,
            })
            const allIntroQuests =
                await this.stores.questStore.getAllIntroQuests(member.id)
            const nextOldMember = allMembers
                .sort(() => Math.random() - 0.5)
                .find(
                    (m) =>
                        !allIntroQuests.some((q) => q.memberIds.includes(m.id))
                )
            if (nextOldMember) {
                this.scheduler.schedule<IntroductionTask>({
                    type: 'introduction-quest',
                    done: false,
                    time: Date.now() + 48 * 3_600_000,
                    payload: {
                        newMemberId: member.id,
                        oldMemberId: nextOldMember.id,
                    },
                })
            }
        }
        for (let vote of req.votes) {
            const ratedMember = await this.getMember(vote.voteForId)
            ratedMember.castVote({
                type: 'quest-vote',
                casted: Date.now(),
                memberId: member.id,
                charisma: vote.charisma,
                wisdom: vote.wisdom,
                questId: quest.id,
            })
            await this.stores.memberStore.save(ratedMember)
        }
        const members = await this.stores.memberStore.find({
            tribeId: member.tribeId,
        })

        const mostCharismatic = findMaxTrait(members, 'charisma')
        const mostWise = findMaxTrait(members, 'wisdom')
        const tribe = await this.getTribe(member.tribeId)
        await this.stores.tribeStore.save({
            ...tribe,
            chiefId: mostCharismatic.id,
            shamanId: mostWise.id,
        })
        await this.stores.questStore.save(quest)
        // TODO COMMIT
    }

    howWasIt = async (task: HowWasQuestTask & Storable) => {
        const quest = await this.getQuest(task.payload.questId)
        const members = await this.stores.memberStore.find({
            id: quest.memberIds,
        })
        const membersViews = mapify(await this.getMembersViews(members))
        for (let member of members) {
            const otherMember = members.find((m) => m.id !== member.id)
            if (!otherMember) throw new Error('Not enough members')
            this.notify<RateMemberMessage>({
                type: 'rate-member-message',
                payload: {
                    targetUserId: member.userId,
                    questId: quest.id,
                    memberName: membersViews[otherMember.id].name,
                    memberId: otherMember.id,
                },
            })
        }

        await this.scheduler.markDone(task.id)
    }
}

interface Vote {
    voteForId: string
    charisma: number
    wisdom: number
}

export interface QuestFinaleRequest {
    userId: string
    questId: string
    // TODO get rid of array here?
    votes: Vote[]
}

export interface RateMemberMessage extends Message {
    type: 'rate-member-message'
    payload: {
        targetUserId: string
        questId: string
        memberName: string
        memberId: string
    }
}
