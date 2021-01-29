import { Coordinates } from './entities/location'
import { TribeStore } from './entities/tribe'

export class StrangerNowhereError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class TribesList {
    private tribesStore: TribeStore
    constructor(tribeGetter: TribeStore) {
        this.tribesStore = tribeGetter
    }
    getLocalTribes({
        coordinates,
        after,
        limit = 10,
    }: {
        coordinates: Coordinates | null
        after?: string
        limit?: number
    }) {
        if (!coordinates) {
            throw new StrangerNowhereError(
                'Cannot get tribes for stranger in the middle of nowhere'
            )
        }
        return this.tribesStore.find({
            coordinates: coordinates,
            after,
            limit,
        })
    }
}
