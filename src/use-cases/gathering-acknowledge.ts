import { ContextUser } from './context-user'

export class GateringAcknowledge extends ContextUser {
    accept = async (req: GatheringAcceptRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        const member = await this.getMember(req.memberId)
        if (member.tribeId !== gathering.tribeId) {
            throw new NotYourTribe(
                `Gathering ${gathering.id} doesn't belong to your tribe`
            )
        }
        gathering.accept(req.memberId)
        this.context.stores.gatheringStore.save(gathering)
    }
    decline = async (req: GatheringDecilneRequest) => {}
}

export interface GatheringAcceptRequest {
    memberId: string
    gatheringId: string
}

export interface GatheringDecilneRequest {
    memberId: string
    gatheringId: string
}

export class NotYourTribe extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
