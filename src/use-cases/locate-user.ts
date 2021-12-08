import { StoredCity } from './entities/city'
import { Context } from './utils/context'
import { ContextUser } from './utils/context-user'

export class LocateUser extends ContextUser {
    constructor(context: Context) {
        super(context)
    }
    async locateUserByCoordinates(req: LocateUserRequest) {
        const city = await this.stores.cityStore.findByCoordinates({
            latitude: req.latitude,
            longitude: req.longitude,
        })
        if (!city) return null

        await this.locateUser(req.userId, city)
        return { name: city.name, id: city.id, timeZone: city.timeZone }
    }
    async locateUserByCityName(req: LocateByCityNameRequest) {
        const cities = await this.stores.cityStore.find({ name: req.cityName })
        if (!cities[0]) return null
        await this.locateUser(req.userId, cities[0])
        return {
            name: cities[0].name,
            id: cities[0].id,
            timeZone: cities[0].timeZone,
        }
    }
    private async locateUser(userId: string, city: StoredCity) {
        const user = await this.getUser(userId)
        user.cityId = city.id
        user.timeZone = city.timeZone
        await this.stores.userStore.save(user)
    }
}

export interface LocateUserRequest {
    userId: string
    longitude: number
    latitude: number
}

interface LocateByCityNameRequest {
    userId: string
    cityName: string
}
