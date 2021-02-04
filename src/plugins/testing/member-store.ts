import { IMember, Member, MemberStore } from '../../use-cases/entities/member'
import { InMemoryStore } from './in-memory-store'

export class InMemoryMemberStore implements MemberStore {
    private _store = new InMemoryStore<IMember>(Member)
    getById = (id: string) => this._store.getById(id)
    save = (member: IMember) => this._store.save(member)
    saveBulk = (members: IMember[]) => this._store.saveBulk(members)

    find = (params: {
        tribeId?: string | string[]
        id?: string | string[]
        userId?: string | string[]
    }) => this._store.find(params)
}
