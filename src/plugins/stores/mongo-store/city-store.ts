import { CityStore, ICity } from '../../../use-cases/entities/city'
import { Coordinates } from '../../../use-cases/entities/location'
import { MongoStore } from './mongo-store'

export class MongoCityStore extends MongoStore<ICity> implements CityStore {
    findByCoordinates = async (coordinates: Coordinates) => {
        // FIXME make it work with actual coordinates
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
}
