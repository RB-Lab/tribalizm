import { Storable, Store } from './store'

export interface TribeStore extends Store<ITribe> {}

export interface ITribeData {
    id: string | null
    name: string
    description: string
    logo: string
    cityId: string
    vocabulary: TribeType
    chiefId: string | null
    shamanId: string | null
}

export interface ITribe extends ITribeData {}

export type RequiredParams = Pick<ITribe, 'name' | 'cityId'>

export class Tribe implements ITribe {
    id: string | null
    name: string
    description: string
    logo: string
    cityId: string
    vocabulary: TribeType
    chiefId: string | null
    shamanId: string | null
    constructor(params: RequiredParams & Partial<ITribeData & Storable>) {
        this.id = params.id || null
        this.chiefId = params.chiefId || null
        this.shamanId = params.shamanId || null
        this.name = params.name
        this.cityId = params.cityId
        this.description = params.description || ''
        this.logo = params.logo || ''
        this.vocabulary = params.vocabulary || TribeType.tribe
    }
}

export enum TribeType {
    tribe = 'tribe',
    club = 'club',
    order = 'order',
    league = 'league',
    church = 'church',
}
