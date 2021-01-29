import { Coordinates } from './location'

export interface TribeStore {
    find: (params: {
        coordinates?: Coordinates
        after?: string
        limit?: number
    }) => Promise<SavedTribe[]>
    getById: (id: string) => Promise<SavedTribe | null>
}

export interface ITribe {
    name: string
    description: string
    logo: string
    vocabulary: TribeType
    chiefId: string
    shamanId: string | null
}
export interface SavedTribe extends ITribe {
    id: string
}

export class Tribe implements ITribe {
    private _id: string | null
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
    private _chiefId: string | null
    get chiefId() {
        if (!this._chiefId) {
            throw new NoChiefTribeError(
                `Tribe ${this.name} (${this.id}) has no chief!`
            )
        }
        return this._chiefId
    }
    private _shamanId: string | null
    get shamanId() {
        return this._shamanId
    }
    constructor(params: {
        id?: string
        chiefId?: string
        shamanId?: string
        name: string
        description?: string
        logo?: string
        vocabulary?: TribeType
    }) {
        this._id = params.id || null
        this._chiefId = params.chiefId || null
        this._shamanId = params.shamanId || null
        this._name = params.name
        this._description = params.description || ''
        this._logo = params.logo || ''
        this._vocabulary = params.vocabulary || TribeType.tribe
    }
}

export class NoChiefTribeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

enum TribeType {
    tribe = 'tribe',
    club = 'club',
    order = 'order',
    league = 'league',
    church = 'church',
}
