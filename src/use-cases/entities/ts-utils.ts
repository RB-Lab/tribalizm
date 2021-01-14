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
