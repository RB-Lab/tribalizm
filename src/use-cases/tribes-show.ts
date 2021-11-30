import { TribeType } from './entities/tribe'
import { ContextUser } from './utils/context-user'

export interface TribeInfo {
    id: string
    name: string
    description: string
    type: TribeType
    membersCount: number
    chief?: {
        name: string
    }
}

export interface TribesRequest {
    userId: string
    after?: string
    limit?: number
}

export class TribeShow extends ContextUser {
    getTribeInfo = async (req: { tribeId: string }) => {
        const tribe = await this.getTribe(req.tribeId)
        const count = await this.stores.memberStore.countTribeMembers(tribe.id)
        const response: TribeInfo = {
            id: tribe.id,
            name: tribe.name,
            description: tribe.description,
            type: tribe.vocabulary,
            membersCount: count,
        }
        if (tribe.chiefId) {
            const chief = await this.getMember(tribe.chiefId)
            const chiefUser = this.getUser(chief.userId)
            response.chief = {
                name: (await chiefUser).name,
            }
        }
        return response
    }
    getLocalTribes = async (req: TribesRequest) => {
        const user = await this.getUser(req.userId)
        if (!user.cityId) return []
        const tribes = await this.stores.tribeStore.find({
            cityId: user.cityId,
        })

        const counts = await this.stores.memberStore.countTribeMembers(
            tribes.map((t) => t.id)
        )

        return tribes.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            type: t.vocabulary,
            membersCount: counts[t.id],
        }))
    }
}
