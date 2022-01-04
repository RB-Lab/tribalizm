import { MultiPolygon } from '../utils/geo-json'
import { Storable, Store } from '../utils/store'

export interface Coordinates {
    latitude: number
    longitude: number
}
export interface CityStore extends Store<ICity> {
    findByCoordinates: (coordinates: Coordinates) => Promise<StoredCity | null>
    autocomplete: (input?: string) => Promise<StoredCity[]>
    prune: () => Promise<void>
}

export interface ICity {
    id: string | null
    name: string
    geometry: MultiPolygon
    timeZone: string
}

export type StoredCity = ICity & Storable
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
