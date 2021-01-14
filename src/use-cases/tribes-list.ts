import { TribeStore } from './entities/tribe'
import { User } from './entities/user'

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
        user,
        after,
        limit = 10,
    }: {
        user: User
        after?: string
        limit?: number
    }) {
        if (!user.coordinates) {
            throw new StrangerNowhereError(
                'Cannot get tribes for stranger in the middle of nowhere'
            )
        }
        return this.tribesStore.find({
            coordinates: user.coordinates,
            after,
            limit,
        })
    }
}
