import { Coordinates } from './location'

export interface TribeStore {
    find: (params: {
        coordinates?: Coordinates
        after?: string
        limit?: number
    }) => Promise<Tribe[]>
    getById: (id: string) => Promise<Tribe | null>
}

export class Tribe {
    private _id: string
    get id() {
        return this._id
    }
    private _name: string
    get name() {
        return this._name
    }
    private _description: string
    get description() {
        return this._description
    }
    private _logo: string
    get logo() {
        return this._logo
    }
    private _vocabulary: TribeType
    get vocabulary() {
        return this._vocabulary
    }
    constructor(
        id: string,
        name: string,
        description: string = '',
        logo: string = '',
        vocabulary: TribeType = TribeType.tribe
    ) {
        this._id = id
        this._name = name
        this._description = description
        this._logo = logo
        this._vocabulary = vocabulary
    }
}

enum TribeType {
    tribe = 'tribe',
    club = 'club',
    order = 'order',
    league = 'league',
    church = 'church',
}
