import { ICity } from '../use-cases/entities/city'
import { StoreUser } from '../use-cases/utils/context-user'

export class TribeViewModel extends StoreUser {
    async getTribeInfo(tribeId: string) {
        const tribe = await this.getTribe(tribeId)
        let city: null | { id: string; name: string; timeZone: string } = null
        if (tribe.cityId) {
            const c = await this.stores.cityStore.getById(tribe.cityId)
            if (c) {
                city = {
                    id: c.id,
                    name: c.name,
                    timeZone: c.timeZone,
                }
            }
        }
        return {
            id: tribe.id,
            name: tribe.name,
            description: tribe.description,
            logo: tribe.logo,
            isInTribe: false,
            city,
        }
    }
}
