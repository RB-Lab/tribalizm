import { City, CityStore, ICity } from '../../../use-cases/entities/city'
import { Coordinates } from '../../../use-cases/entities/location'
import { MongoStore } from './mongo-store'

export class MongoCityStore extends MongoStore<ICity> implements CityStore {
    _class = City
    findByCoordinates = async (coordinates: Coordinates) => {
        // TODO search in nearby cities
        const res = await this._collection.findOne({
            geometry: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [
                            coordinates.longitude,
                            coordinates.latitude,
                        ],
                    },
                },
            },
        })

        return res ? this._instantiate(res) : null
    }
    autocomplete = async (input?: string) => {
        const find = input ? { name: new RegExp(`^${input}`) } : {}
        const cursor = this._collection
            .find(find, { projection: { geometry: 0 } })
            .sort({ name: 1 })
            .limit(10)
        const res = await cursor.toArray()
        return res.map(this._instantiate)
    }
}
