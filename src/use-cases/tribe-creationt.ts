import { Member } from './entities/member'
import { Tribe } from './entities/tribe'
import { ContextUser } from './utils/context-user'

interface CreateTribeRequest {
    userId: string
    name: string
    logo?: string
    description: string
}

export class TribeCreation extends ContextUser {
    createTribe = async (req: CreateTribeRequest) => {
        const tribe = await this.stores.tribeStore.save(
            new Tribe({
                name: req.name,
                description: req.description,
                logo: req.logo,
            })
        )
        const user = await this.getUser(req.userId)
        const member = new Member({
            tribeId: tribe.id,
            userId: user.id,
            isCandidate: false,
        })
        await this.stores.memberStore.save(member)
        const newTribe = await this.stores.tribeStore.save(tribe)
        return newTribe.id
    }
}
