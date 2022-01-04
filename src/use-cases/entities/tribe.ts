import { Storable, Store } from '../utils/store'

export interface TribeStore extends Store<ITribe> {}

export interface ITribeData {
    id: string | null
    name: string
    description: string
    logo: string
    cityId: string | null
}

// TODO MIGRATE: drop shamanId, chiefId, vocabulary

export interface ITribe extends ITribeData {}

export type RequiredParams = Pick<ITribe, 'name'>
export type SavedTribe = ITribeData & Storable

export class Tribe implements ITribe {
    id: string | null
    name: string
    description: string
    logo: string
    cityId: string | null
    constructor(params: RequiredParams & Partial<SavedTribe>) {
        this.id = params.id || null
        this.name = params.name
        this.cityId = params.cityId || null
        this.description = params.description || ''
        this.logo = params.logo || ''
    }
}
