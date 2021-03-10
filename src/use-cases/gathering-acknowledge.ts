import { ContextUser } from './context-user'

export class GateringAcknowledge extends ContextUser {
    accept = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        await this.checkTribe(req)
        gathering.accept(req.memberId)
        this.context.stores.gatheringStore.save(gathering)
    }
    decline = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        await this.checkTribe(req)
        gathering.decline(req.memberId)
        this.context.stores.gatheringStore.save(gathering)
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

export class NotYourTribe extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
