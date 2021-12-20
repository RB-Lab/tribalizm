import { Member } from './entities/member'
import { Tribe } from './entities/tribe'
import { ContextUser } from './utils/context-user'

export class TribeCreation extends ContextUser {
    createTribe = async (req: {
        userId: string
        name: string
        description: string
    }) => {
        const tribe = await this.stores.tribeStore.save(
            new Tribe({
                name: req.name,
                description: req.description,
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
        await this.stores.tribeStore.save(tribe)
    }
}
