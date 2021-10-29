import { MultiPolygon } from '../utils/geo-json'
import { Coordinates } from './location'
import { Storable, Store } from './store'

export interface CityStore extends Store<ICity> {
    findByCoordinates: (
        coordinates: Coordinates
    ) => Promise<(ICity & Storable) | null>
    findByName: (searchString: string) => Promise<(ICity & Storable) | null>
}

export interface ICity {
    id: string | null
    name: string
    geometry: MultiPolygon
}

export class City implements ICity {
    public id: string | null
    public name: string
    geometry: MultiPolygon
    constructor(params: Pick<ICity, 'name'> & Partial<ICity & Storable>) {
        this.id = params.id || null
        this.name = params.name
        this.geometry = params.geometry || {
            type: 'MultiPolygon',
            coordinates: [[[]]],
        }
    }
}
