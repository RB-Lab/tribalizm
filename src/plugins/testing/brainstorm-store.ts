import {
    Brainstorm,
    BrainstormStore,
    IBrainstorm,
} from '../../use-cases/entities/brainstorm'
import { InMemoryStore } from './in-memory-store'

export class InMemoryBrainstormStore implements BrainstormStore {
    private _store = new InMemoryStore<IBrainstorm>(Brainstorm)
    getById = (id: string) => this._store.getById(id)
    save = (storm: IBrainstorm) => this._store.save(storm)
}
