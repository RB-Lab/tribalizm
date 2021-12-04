import path from 'path'
import { createContext } from '../specs/test-context'
import { loadCities } from './load-cities'

async function run() {
    const filePath = path.join(process.cwd(), 'meta/cities.geojson')
    describe('Load cities script', () => {
        it('loads Sabha', async () => {
            const { stores } = await createContext()
            await loadCities(filePath, stores.cityStore)
            const sabha = await stores.cityStore.findByCoordinates({
                latitude: 27.03,
                longitude: 14.5,
            })
            expect(sabha).toBeTruthy()
            expect(sabha?.name).toBe('Sabha')
        })

        it('loads Sabha', async () => {
            const { stores } = await createContext()
            await loadCities(filePath, stores.cityStore)
            const sabha = await stores.cityStore.findByCoordinates({
                latitude: -37.8,
                longitude: 145,
            })
            expect(sabha).toBeTruthy()
            expect(sabha?.name).toBe('Melbourne')
        })
    })
}

if (process.env.FULL_TEST === 'true') {
    run()
}
