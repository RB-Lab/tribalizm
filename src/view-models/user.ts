import { mapify, notEmpty } from '../ts-utils'
import { StoreUser } from '../use-cases/utils/context-user'

export class UserViewModel extends StoreUser {
    getUserInfo = async (userId: string) => {
        const members = await this.stores.memberStore.findSimple({ userId })
        return {
            hasTribes: members.length > 0,
        }
    }
    getUserTribes = async (userId: string) => {
        const members = await this.stores.memberStore.findSimple({ userId })
        const tribes = await this.stores.tribeStore.findSimple({
            id: members.map((m) => m.tribeId),
        })
        return tribes.map((t) => ({
            id: t.id,
            name: t.name,
        }))
    }
    getUserInfoList = async (userIds: string[]) => {
        const users = await this.stores.userStore.findSimple({ id: userIds })
        const members = await this.stores.memberStore.findSimple({
            userId: userIds,
        })
        const membersMap = mapify(members)
        const memberIdsMap = members.reduce<Record<string, string[]>>(
            (r, m) => ({
                ...r,
                [m.userId]: r[m.userId] ? [...r[m.userId], m.id] : [m.id],
            }),
            {}
        )
        const tribeIds = members.map((m) => m.tribeId)
        const tribes = await this.stores.tribeStore.findSimple({ id: tribeIds })
        const tribesMap = mapify(tribes)
        const cityIds = tribes.map((t) => t.cityId).filter(notEmpty)
        const citiesMap = mapify(
            await this.stores.cityStore.findSimpleCities({ id: cityIds })
        )

        return users.map<FullUserInfo>((u) => {
            const memberIds = memberIdsMap[u.id] || []
            const tribes = memberIds.map(
                (id) => tribesMap[membersMap[id].tribeId]
            )

            return {
                id: u.id,
                name: u.name,
                tribes: tribes.map((t) => ({
                    id: t.id,
                    name: t.name,
                    city: t.cityId
                        ? {
                              name: citiesMap[t.cityId].name,
                              timeZone: citiesMap[t.cityId].timeZone,
                          }
                        : null,
                })),
            }
        })
    }
}

interface FullUserInfo {
    id: string
    name: string
    tribes: Array<{
        id: string
        name: string
        city: null | {
            name: string
            timeZone: string
        }
    }>
}
