import { QuestType } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { findMaxTrait } from './utils/members-utils'
import { IntroductionTask } from './utils/scheduler'

export class QuestFinale extends ContextUser {
    finalyze = async (req: QuestFinaleRequest) => {
        const quest = await this.getQuest(req.questId)
        quest.finish(req.memberId)
        const member = await this.getMember(req.memberId)
        // TODO BEGIN transaction
        // TODO 🤔 this looks like it doesn't belong here...
        if (quest.type === QuestType.introduction) {
            const allMembers = await this.stores.memberStore.find({
                tribeId: member.tribeId,
            })
            const allIntroQuests =
                await this.stores.questStore.getAllIntroQuests(req.memberId)
            const nextOldMember = allMembers
                .sort(() => Math.random() - 0.5)
                .find(
                    (m) =>
                        !allIntroQuests.some((q) => q.memberIds.includes(m.id))
                )
            if (nextOldMember) {
                this.scheduler.schedule<IntroductionTask>({
                    type: 'intorduction-quest',
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
            const member = await this.getMember(vote.voteForId)
            member.castVote({
                type: 'quest-vote',
                casted: Date.now(),
                charisma: vote.charisma,
                wisdom: vote.wisdom,
                memberId: req.memberId,
                questId: quest.id,
            })
            await this.stores.memberStore.save(member)
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
}

interface Vote {
    voteForId: string
    charisma: number
    wisdom: number
}

export interface QuestFinaleRequest {
    memberId: string
    questId: string
    // TODO get rid of array here?
    votes: Vote[]
}
