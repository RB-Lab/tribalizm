import { Coordinates } from '../entities/location'
import { SavedTribe, TribeStore } from '../entities/tribe'
import { StrangerNowhereError, TribesList } from '../list-tribes'

describe('Stranger loosk throug list of tribes', () => {
    it('should see first N tribes available for them', async () => {
        const tribes = [] as SavedTribe[]
        const tribseStore = jasmine.createSpyObj<TribeStore>({
            find: Promise.resolve(tribes),
        })
        const coordinates: Coordinates = { latitude: 42, longitude: 23 }

        const tribesList = new TribesList(tribseStore)
        const result = await tribesList.getLocalTribes({
            coordinates,
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

    it('should get StrangerNowhere error if they has no coordinates', () => {
        const tribesList = new TribesList({} as TribeStore)
        expect(() =>
            tribesList.getLocalTribes({ coordinates: null })
        ).toThrowError(StrangerNowhereError)
    })
})
