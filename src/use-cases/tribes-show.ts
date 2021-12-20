import { TribeType } from './entities/tribe'
import { ContextUser } from './utils/context-user'

export interface TribeInfo {
    id: string
    name: string
    description: string
    membersCount: number
    logo: string
    isInTribe: boolean
}

export interface TribesRequest {
    userId: string
    after?: string
    limit?: number
}

export class TribeShow extends ContextUser {
    getTribeInfo = async (req: { tribeId: string; userId?: string }) => {
        const tribe = await this.getTribe(req.tribeId)
        const count = await this.stores.memberStore.countTribeMembers(tribe.id)
        const response: TribeInfo = {
            id: tribe.id,
            name: tribe.name,
            description: tribe.description,
            membersCount: count,
            logo: tribe.logo,
            isInTribe: false,
        }
        if (req.userId) {
            const members = await this.stores.memberStore.findSimple({
                userId: req.userId,
            })
            if (members.some((m) => m.tribeId === req.tribeId)) {
                response.isInTribe = true
            }
        }
        return response
    }
    getAstralTribes = async (req: TribesRequest) => {
        return this.listTribes(req.userId, null, req.limit, req.after)
    }
    getLocalTribes = async (req: TribesRequest) => {
        const user = await this.getUser(req.userId)
        // TODO instead of [] here we must return _something_ so that client code would
        //      re-request location from user
        if (!user.cityId) return []
        return await this.listTribes(user.id, user.cityId, req.limit, req.after)
    }

    getCityInfo = async (cityId: string) => {
        const city = await this.stores.cityStore.getById(cityId)
        if (!city) return null
        return { name: city.name, id: city.id, timeZone: city.timeZone }
    }

    private async listTribes(
        userId: string,
        cityId: string | null,
        limit?: number,
        cursor?: string
    ) {
        const userMembers = await this.stores.memberStore.findSimple({ userId })

        const tribes = await this.stores.tribeStore.find(
            { cityId },
            { id: userMembers.map((m) => m.tribeId) },
            { limit, cursor }
        )

        const counts = await this.stores.memberStore.countTribeMembers(
            tribes.map((t) => t.id)
        )

        return tribes.map<TribeInfo>((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            membersCount: counts[t.id],
            logo: t.logo,
            isInTribe: false,
        }))
    }
}
