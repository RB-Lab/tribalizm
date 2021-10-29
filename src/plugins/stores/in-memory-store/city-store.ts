import { CityStore, ICity } from '../../../use-cases/entities/city'
import { Coordinates } from '../../../use-cases/entities/location'
import { InMemoryStore } from './in-memory-store'

export class InMemoryCityStore
    extends InMemoryStore<ICity>
    implements CityStore
{
    findByCoordinates = async (coordinates: Coordinates) => {
        const res = Object.values(this._store)[0]
        return res ? this._instantiate(res) : null
    }

    findByName = async (searchString: string) => {
        // TODO implement
        return null
    }
}
