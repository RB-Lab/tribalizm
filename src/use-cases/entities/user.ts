import { Storable, Store } from './store'

export interface UserStore extends Store<IUser> {}

export interface IUser {
    id: string | null
    name: string
}
export type StoredUser = IUser & Storable

export class User implements IUser {
    public id: string | null
    public name: string
    constructor(params: Pick<IUser, 'name'> & Partial<StoredUser>) {
        this.id = params.id || null
        this.name = params.name
    }
}
