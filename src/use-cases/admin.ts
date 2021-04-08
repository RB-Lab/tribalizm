import { Member } from './entities/member'
import { Tribe, TribeType } from './entities/tribe'
import { ContextUser } from './utils/context-user'

export class Admin extends ContextUser {
    addTribeMemer = async (req: AddMemberRequest) => {
        const tribe = await this.getTribe(req.tribeId)
        if (tribe.chiefId !== null) {
            throw new AlreadyHaveChief(
                `Cannot add members to ${
                    tribe.id + ''
                }: it already have chief, members should apply the regular way`
            )
        }
        const user = await this.getUser(req.userId)
        const member = new Member({
            tribeId: tribe.id,
            userId: user.id,
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
        await this.stores.tribeStore.save({
            ...tribe,
            chiefId: savedMember.id,
            shamanId: savedMember.id,
        })
        return savedMember
    }
    createTribe = async (req: CreateTribeRequest) => {
        return await this.stores.tribeStore.save(new Tribe(req))
    }
}

interface CreateTribeRequest {
    name: string
    cityId: string
    description?: string
    logo?: string
    vocabulary?: TribeType
}

interface AddMemberRequest {
    tribeId: string
    userId: string
}

export class AlreadyHaveChief extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
