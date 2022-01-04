import { Storable, Store } from '../utils/store'

export interface UserStore extends Store<IUser> {}

export interface IUser {
    id: string | null
    name: string
    cityId?: string
    timeZone?: string
}
export type StoredUser = IUser & Storable

export class User implements IUser {
    public id: string | null
    public name: string
    public cityId?: string
    public timeZone?: string
    constructor(params: Pick<IUser, 'name'> & Partial<StoredUser>) {
        this.id = params.id || null
        this.name = params.name
        this.cityId = params.cityId
        this.timeZone = params.timeZone
    }
}
