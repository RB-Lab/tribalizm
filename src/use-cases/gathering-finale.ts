import { isCoordinationQuest } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { findMaxTrait } from './utils/members-utils'

export class GatheringFinale extends ContextUser {
    finalize = async (req: FinalizeGatheringRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        gathering.imDone(req.memberId)
        const coordinators = new Set<string>()
        const addCoordinators = async (parentQuestId: string | null) => {
            if (parentQuestId) {
                const quest = await this.getQuest(parentQuestId)
                if (!isCoordinationQuest(quest)) {
                    throw new Error(
                        `Cannot re-spawn non-coordination quest ${quest.id} (${quest.type})`
                    )
                }
                quest.memberIds.forEach((id) => coordinators.add(id))
                await addCoordinators(quest.parentQuestId)
            }
        }
        await addCoordinators(gathering.parentQuestId)
        const members = await this.stores.memberStore.find({
            id: [...coordinators],
        })
        members.forEach((member) => {
            if (member.id !== req.memberId) {
                member.castVote({
                    type: 'gathering-vote',
                    casted: Date.now(),
                    gatheringId: gathering.id,
                    memberId: req.memberId,
                    score: req.score,
                })
            }
        })
        await this.stores.memberStore.saveBulk(members)
        const tribeMembers = await this.stores.memberStore.find({
            tribeId: gathering.tribeId,
        })
        const mostCharismatic = findMaxTrait(tribeMembers, 'charisma')
        const mostWise = findMaxTrait(tribeMembers, 'wisdom')
        const tribe = await this.getTribe(gathering.tribeId)
        await this.stores.tribeStore.save({
            ...tribe,
            chiefId: mostCharismatic.id,
            shamanId: mostWise.id,
        })
        await this.stores.gatheringStore.save(gathering)
    }
}

interface FinalizeGatheringRequest {
    memberId: string
    gatheringId: string
    score: number
}
