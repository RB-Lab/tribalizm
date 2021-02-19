import { Coordinates } from './location'

export interface UserStore {
    getById: (id: string) => Promise<SavedUser | null>
}

export interface IUser {
    id: string | null
    name: string
    coordinates: Coordinates | null
}
export interface SavedUser extends IUser {
    id: string
}

export class User implements IUser {
    public id: string | null
    public name: string
    public coordinates: Coordinates | null
    constructor(params: Pick<IUser, 'name'> & Partial<SavedUser>) {
        this.id = params.id || null
        this.name = params.name
        this.coordinates = params.coordinates || null
    }
}
