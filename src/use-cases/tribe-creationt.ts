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

        // we consider tribe creation to be initial gathering
        member.castVote({
            type: 'gathering-vote',
            casted: Date.now(),
            gatheringId: 'initial',
            memberId: 'spirits',
            score: 4,
        })
        const savedMember = await this.stores.memberStore.save(member)
        tribe.chiefId = savedMember.id
        const newTribe = await this.stores.tribeStore.save(tribe)
        return newTribe.id
    }
}
