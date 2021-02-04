import {
    Application,
    ApplicationStore,
    IApplication,
} from '../../use-cases/entities/application'
import { InMemoryStore } from './in-memory-store'

export class InMemoryApplicationStore implements ApplicationStore {
    private _store = new InMemoryStore<IApplication>(Application)
    getById = (id: string) => this._store.getById(id)
    save = (app: IApplication) => this._store.save(app)
}
