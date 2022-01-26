import {
    City,
    CityStore,
    Coordinates,
    ICity,
    StoredSimpleCity,
} from '../../../use-cases/entities/city'
import { Query } from '../../../use-cases/utils/store'
import { MongoStore, objectify, toQuery } from './mongo-store'

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
    findSimpleCities = async (
        query: Query<StoredSimpleCity, keyof StoredSimpleCity>
    ) => {
        this.find
        const cursor = this._collection
            .find(toQuery(objectify(query)), { projection: { geometry: 0 } })
            .sort({ name: 1 })
            .limit(10)
        const res = await cursor.toArray()
        return res.map(this._instantiate)
    }

    prune = async () => {
        try {
            await this._collection.drop()
        } catch (ignore) {}
    }
}
