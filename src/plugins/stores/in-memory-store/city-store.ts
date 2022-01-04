import {
    City,
    CityStore,
    Coordinates,
    ICity,
} from '../../../use-cases/entities/city'
import { InMemoryStore } from './in-memory-store'

export class InMemoryCityStore
    extends InMemoryStore<ICity>
    implements CityStore
{
    _class = City
    findByCoordinates = async (coordinates: Coordinates) => {
        const res = Object.values(this._store)[0]
        return res ? this._instantiate(res) : null
    }
    autocomplete = async (input?: string) => {
        const res = Object.values(this._store).filter((v) =>
            v.name.startsWith(input)
        )
        return res.map(this._instantiate)
    }
    prune = async () => {
        this._store = []
    }
}
