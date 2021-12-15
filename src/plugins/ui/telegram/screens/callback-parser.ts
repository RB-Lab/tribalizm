let usedCbNames: string[] = []
export function purgeGlobalCallbackRegistry() {
    usedCbNames = []
}
function makeRegex(str: string) {
    return new RegExp(`${str}:(.+)|${str}`)
}
export function makeCallbackDataParser<T extends {}>(
    cbName: string,
    keys: Array<keyof T>
) {
    for (let oldName of usedCbNames) {
        if (
            makeRegex(oldName).test(cbName) ||
            makeRegex(cbName).test(oldName)
        ) {
            throw new Error(`Callback name ${cbName} clashes with ${oldName}`)
        }
    }

    usedCbNames.push(cbName)

    return {
        /** if data is not set all keys will be undefined */
        serialize: (data?: T) => {
            if (!data) {
                return cbName
            }
            const cbData = keys
                .map((k) => {
                    const value = data[k]
                    if (typeof value === 'string' && value.includes(':')) {
                        throw new Error(
                            `Cannot make callback data, invalid character: ${data[k]}`
                        )
                    }
                    return value
                })
                .join(':')
            const result = cbData ? `${cbName}:${cbData}` : cbName
            if (result.length > 64) {
                throw new Error(`Serialized value is too long: ${result}`)
            }
            return result
        },
        /** if data was not provided during serialization, all keys will be undefined */
        parse: (str: string) => {
            const arr = str.replace(`${cbName}`, '').split(':').slice(1)
            return keys.reduce<T>((r, k, i) => ({ ...r, [k]: arr[i] }), {} as T)
        },
        regex: makeRegex(cbName),
        toString: () => cbName,
    }
}
