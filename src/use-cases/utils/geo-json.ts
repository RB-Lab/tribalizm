// TODO this file is probably in wrong folder...

export function isMultiPoligon(feature: any): feature is MultiPolygon {
    return feature.type === 'MultiPolygon'
}

export interface FeatureCollection {
    type: 'FeatureCollection'
    name: string
    crs?: {
        type: 'name'
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
    }
    features: [
        {
            type: 'Feature'
            properties: { [key: string]: string }
            geometry:
                | MultiPolygon
                | Point
                | LineString
                | Polygon
                | MultiPoint
                | MultiLineString
        }
    ]
}

export interface MultiPolygon {
    type: 'MultiPolygon'
    coordinates: [number, number][][][]
}

export interface Point {
    type: 'Point'
    coordinates: [number, number]
}

export interface LineString {
    type: 'LineString'
    coordinates: [number, number][]
}

export interface Polygon {
    type: 'Polygon'
    coordinates: [number, number][][]
}

export interface MultiPoint {
    type: 'MultiPoint'
    coordinates: [number, number][]
}

export interface MultiLineString {
    type: 'MultiLineString'
    coordinates: [number, number][][]
}
