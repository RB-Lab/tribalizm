export function notEmpty<TValue>(
    value: TValue | null | undefined
): value is TValue {
    return value !== null && value !== undefined
}

export type Maybe<T> = null | undefined | T

export function filterMaybeArrayMaybe<T>(array: Maybe<Maybe<T>[]>) {
    if (array === null || array === undefined) {
        return []
    }
    return array.filter(notEmpty)
}

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T

export function mapify<T extends { id: string }>(arr: T[]) {
    return arr.reduce<Record<string, T>>((r, i) => ({ ...r, [i.id]: i }), {})
}

export const noop = (...a: any[]) => {}

export function objectHasProp<X extends {}, Y extends PropertyKey>(
    obj: X,
    prop: Y
): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop)
}
export function hasPropertyValue<T extends {}>(
    obj: Maybe<T>,
    prop: PropertyKey,
    value: any
) {
    return notEmpty(obj) && objectHasProp(obj, prop) && obj[prop] === value
}

export function assertNever(x: never): never {
    throw new Error('Unexpected value. Should have been never.')
}

// OK, these are not exactly TS-utils, but let them be here for some time...
export function base64Encode(str: string) {
    return Buffer.from(str, 'utf-8').toString('base64')
}

export function base64Decode(str: string) {
    return Buffer.from(str, 'base64').toString('utf-8')
}

/**
 * Creates an array of numbers from `start` to `end` inclusive.
 * If only on argument is given returns an array of that length starting from 0
 */
export function range(start: number, end?: number) {
    if (end === undefined) {
        end = start - 1
        start = 0
    }

    return Array.from({ length: end - start + 1 }).map((_, i) => i + start)
}
