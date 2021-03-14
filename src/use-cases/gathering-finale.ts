import { ContextUser } from './context-user'

export class GatheringFinale extends ContextUser {
    finalize = async (req: FinalizeGatheringRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        gathering.imDone(req.memberId)
        const coordinators = new Set<string>()
        const addCoordinators = async (parentQuestId: string | null) => {
            if (parentQuestId) {
                const quest = await this.getQuest(parentQuestId)
                quest.memberIds.forEach((id) => coordinators.add(id))
                await addCoordinators(quest.parentQuestId)
            }
        }
        await addCoordinators(gathering.parentQuestId)
        const members = await this.stores.memberStore.find({
            id: [...coordinators],
        })
        members.forEach((member) => {
            member.castVote({
                type: 'gathering-vote',
                casted: Date.now(),
                gatheringId: gathering.id,
                memberId: req.memberId,
                score: req.score,
            })
        })
        await this.stores.memberStore.saveBulk(members)
        await this.stores.gatheringStore.save(gathering)
    }
}

interface FinalizeGatheringRequest {
    memberId: string
    gatheringId: string
    score: number
}
