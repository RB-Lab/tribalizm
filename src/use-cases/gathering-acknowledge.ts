import { NotYourTribe } from './utils/not-your-tribe'
import { ContextUser } from './utils/context-user'
import { EntityNotFound } from './utils/errors'

export class GatheringAcknowledge extends ContextUser {
    accept = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        const member = await this.getGatheringMember(req)
        gathering.accept(member.id)
        await this.stores.gatheringStore.save(gathering)
    }
    decline = async (req: GatheringAcknowledgeRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        const member = await this.getGatheringMember(req)
        gathering.decline(member.id)
        await this.stores.gatheringStore.save(gathering)
    }

    private async getGatheringMember(req: GatheringAcknowledgeRequest) {
        const gathering = await this.getGathering(req.gatheringId)
        try {
            const member = await this.getTribeMemberByUserId(
                gathering.tribeId,
                req.userId
            )
            return member
        } catch (e) {
            if (e instanceof EntityNotFound) {
                throw new NotYourTribe(
                    `Gathering ${gathering.id} doesn't belong to your tribe`
                )
            }
            throw e
        }
    }
}

export interface GatheringAcknowledgeRequest {
    userId: string
    gatheringId: string
}
