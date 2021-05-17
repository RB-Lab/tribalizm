import { CityStore, ICity } from '../../../use-cases/entities/city'
import { Coordinates } from '../../../use-cases/entities/location'
import { MongoStore } from './mongo-store'

export class MongoCityStore extends MongoStore<ICity> implements CityStore {
    findByCoordinates = async (coordinates: Coordinates) => {
        // FIXME make it work with actual coordinates
        const res = await this._last()
        return res ? this._instantiate(res) : null
    }
}
