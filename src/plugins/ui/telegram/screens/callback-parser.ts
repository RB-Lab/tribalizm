// TODO add constrain so that T's values are only strings
export function makeCallbackDataParser<T>(
    cbName: string,
    keys: Array<keyof T>
) {
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
            return cbData ? `${cbName}:${cbData}` : cbName
        },
        /** if data was not provided during serialization, all keys will be undefined */
        parse: (str: string) => {
            const arr = str.replace(`${cbName}`, '').split(':').slice(1)
            return keys.reduce<T>((r, k, i) => ({ ...r, [k]: arr[i] }), {} as T)
        },
        regex: new RegExp(`${cbName}:(.+)|${cbName}`),
    }
}
