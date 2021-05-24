import * as fs from 'fs'
import * as path from 'path'
import { City, CityStore } from '../use-cases/entities/city'
import { FeatureCollection, isMultiPoligon } from '../use-cases/utils/geo-json'

export async function loadCities(src: string, store: CityStore) {
    const filePath = path.join(process.cwd(), src)
    const fc = JSON.parse(
        fs.readFileSync(filePath, 'utf-8')
    ) as FeatureCollection
    for (let feature of fc.features) {
        if (isMultiPoligon(feature.geometry)) {
            await store.save(
                new City({
                    name: feature.properties.NAME,
                    geometry: feature.geometry,
                })
            )
        }
    }
}
