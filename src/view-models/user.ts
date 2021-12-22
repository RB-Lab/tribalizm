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
}
