// TODO add constarin so that T's values are only strings
export function makeCalbackDataParser<T>(cbName: string, keys: Array<keyof T>) {
    return {
        serialize: (data: T) => {
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
            return `${cbName}:${cbData}`
        },
        parse: (str: string) => {
            const arr = str.replace(`${cbName}:`, '').split(':')
            return keys.reduce<T>((r, k, i) => ({ ...r, [k]: arr[i] }), {} as T)
        },
        regex: new RegExp(`${cbName}:(.+)`),
    }
}
