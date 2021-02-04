import { Coordinates } from '../../use-cases/entities/location'
import { ITribe, Tribe, TribeStore } from '../../use-cases/entities/tribe'
import { InMemoryStore } from './in-memory-store'

export class InMemoryTribeStore implements TribeStore {
    private _store = new InMemoryStore<ITribe>(Tribe)
    getById = (id: string) => this._store.getById(id)
    save = (tribe: ITribe) => this._store.save(tribe)

    find = (params: {
        coordinates?: Coordinates
        after?: string
        limit?: number
    }) => this._store.find(params as any)
}
