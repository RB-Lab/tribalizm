import { Coordinates } from './location'

export interface User {
    id: string
    coordinates: Coordinates | null
}
