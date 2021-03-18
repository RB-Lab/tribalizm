import { Coordinates } from './location'
import { Storable, Store } from './store'

export interface UserStore extends Store<IUser> {}

export interface IUser {
    id: string | null
    name: string
    coordinates: Coordinates | null
}

export class User implements IUser {
    public id: string | null
    public name: string
    public coordinates: Coordinates | null
    constructor(params: Pick<IUser, 'name'> & Partial<IUser & Storable>) {
        this.id = params.id || null
        this.name = params.name
        this.coordinates = params.coordinates || null
    }
}
