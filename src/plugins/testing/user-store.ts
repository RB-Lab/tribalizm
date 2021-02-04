import {
    IUser,
    SavedUser,
    User,
    UserStore,
} from '../../use-cases/entities/user'
import { InMemoryStore } from './in-memory-store'

export class InMemoryUserStore implements UserStore {
    private _store = new InMemoryStore<IUser>(User)
    getById = (id: string) => this._store.getById(id)
    save = (app: IUser) => this._store.save(app)
}
