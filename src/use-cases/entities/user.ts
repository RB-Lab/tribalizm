import { Coordinates } from './location'

export interface UserStore {
    getById: (id: string) => Promise<SavedUser | null>
}

export interface IUser {
    name: string
    coordinates: Coordinates | null
}
export interface SavedUser extends IUser {
    id: string
}

export class User implements IUser {
    private _id: string | null
    get id() {
        return this._id
    }
    private _name: string
    get name() {
        return this._name
    }
    private _coordinates: Coordinates
    get coordinates() {
        return this._coordinates
    }
    constructor(params: {
        id: string
        name: string
        coordinates: Coordinates
    }) {
        this._id = params.id
        this._name = params.name
        this._coordinates = params.coordinates
    }
}
