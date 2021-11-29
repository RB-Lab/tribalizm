import { NotYourTribe } from './utils/not-your-tribe'
import { ContextUser } from './utils/context-user'

export class GatheringAcknowledge extends ContextUser {
    accept = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        await this.checkTribe(req)
        gathering.accept(req.memberId)
        this.stores.gatheringStore.save(gathering)
    }
    decline = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        await this.checkTribe(req)
        gathering.decline(req.memberId)
        this.stores.gatheringStore.save(gathering)
    }

    private async checkTribe(req: GatheringAcknowledgeRequest) {
        const gathering = await this.getGathering(req.gatheringId)
        const member = await this.getMember(req.memberId)
        if (member.tribeId !== gathering.tribeId) {
            throw new NotYourTribe(
                `Gathering ${gathering.id} doesn't belong to your tribe`
            )
        }
    }
}

export interface GatheringAcknowledgeRequest {
    memberId: string
    gatheringId: string
}
