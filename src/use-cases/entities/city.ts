import { Coordinates } from './location'
import { Storable, Store } from './store'

export interface CityStore extends Store<ICity> {
    findByCoordinates: (
        coordinates: Coordinates
    ) => Promise<(ICity & Storable) | null>
}

export interface ICity {
    id: string | null
    name: string
}

export class City implements ICity {
    public id: string | null
    public name: string
    constructor(params: Pick<ICity, 'name'> & Partial<ICity & Storable>) {
        this.id = params.id || null
        this.name = params.name
    }
}
