import * as fs from 'fs'
import { City, CityStore } from '../use-cases/entities/city'
import { FeatureCollection, isMultiPolygon } from '../use-cases/utils/geo-json'

export async function loadCities(src: string, store: CityStore) {
    const fc = JSON.parse(fs.readFileSync(src, 'utf-8')) as FeatureCollection
    await store.prune()
    for (let feature of fc.features) {
        if (isMultiPolygon(feature.geometry)) {
            await store.save(
                new City({
                    name: feature.properties.NAME,
                    geometry: feature.geometry,
                    timeZone: feature.properties.TIMEZONE,
                })
            )
        }
    }
}
