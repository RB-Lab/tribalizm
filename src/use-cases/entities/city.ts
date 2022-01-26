import { MultiPolygon } from '../utils/geo-json'
import { Query, Storable, Store } from '../utils/store'

export interface Coordinates {
    latitude: number
    longitude: number
}
export interface CityStore extends Store<ICity> {
    findByCoordinates: (coordinates: Coordinates) => Promise<StoredCity | null>
    autocomplete: (input?: string) => Promise<StoredSimpleCity[]>
    /** the same as `findSimple` but without city geometry */
    findSimpleCities: <K extends keyof StoredSimpleCity>(
        query: Query<StoredSimpleCity, K>
    ) => Promise<StoredSimpleCity[]>
    prune: () => Promise<void>
}

export interface SimpleCity {
    id: string | null
    name: string
    timeZone: string
}

export interface ICity extends SimpleCity {
    geometry: MultiPolygon
}

export type StoredCity = ICity & Storable
export type StoredSimpleCity = SimpleCity & Storable

export class City implements ICity {
    public id: string | null
    public name: string
    geometry: MultiPolygon
    timeZone: string
    constructor(
        params: Pick<ICity, 'timeZone' | 'name'> & Partial<StoredCity>
    ) {
        this.id = params.id || null
        this.name = params.name
        this.geometry = params.geometry || {
            type: 'MultiPolygon',
            coordinates: [[[]]],
        }
        this.timeZone = params.timeZone
    }
}
