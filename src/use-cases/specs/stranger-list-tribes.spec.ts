import { Coordinates } from '../entities/location'
import { Tribe, TribeStore } from '../entities/tribe'
import { User } from '../entities/user'
import { TribesList, StrangerNowhereError } from '../tribes-list'

describe('Stranger loosk throug list of tribes', () => {
    it('should see first N tribes available for them', async () => {
        const tribes = [] as Tribe[]
        const tribseStore = jasmine.createSpyObj<TribeStore>({
            find: Promise.resolve(tribes),
        })
        const coordinates: Coordinates = { latitude: 42, longitude: 23 }
        const user: User = { coordinates } as User

        const tribesList = new TribesList(tribseStore)
        const result = await tribesList.getLocalTribes({
            user,
            limit: 10,
            after: 'foo',
        })
        expect(result).toBe(tribes)
        expect(tribseStore.find).toHaveBeenCalledWith({
            coordinates,
            after: 'foo',
            limit: 10,
        })
    })

    it('should get StrangerNowhere error if thet has no coordinates', () => {
        const tribesList = new TribesList({} as TribeStore)
        expect(() =>
            tribesList.getLocalTribes({ user: { coordinates: null } as User })
        ).toThrowError(StrangerNowhereError)
    })
})
