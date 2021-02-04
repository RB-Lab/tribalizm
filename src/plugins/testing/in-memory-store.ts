import * as equal from 'fast-deep-equal'

interface Storable {
    id: string
}
export class InMemoryStore<T> {
    private _store: Record<string, any> = {}
    get store() {
        return this._store
    }
    private _getId = () => Math.random().toString().slice(2)
    private _class: new (record: any) => T
    private _instantiate = (record: any) => {
        return new this._class(record) as T & Storable
    }
    private _serialize = (doc: any) => {
        const keys = [
            ...Object.keys(
                Object.getOwnPropertyDescriptors(Object.getPrototypeOf(doc))
            ),
            ...Object.keys(doc),
        ]
        return Array.from(new Set(keys)).reduce((res, key) => {
            const value = doc[key]
            if (
                typeof value === 'function' ||
                key.startsWith('_') ||
                key === 'constructor'
            ) {
                return res
            }
            return { ...res, [key]: value }
        }, {})
    }
    private _log = (...args: any[]) => {
        console.log(`${this._class.name}: `, ...args)
    }

    constructor(_class: new (record: any) => T) {
        this._class = _class
    }

    save = (doc: T | (T & Storable)) => {
        const id = 'id' in doc && doc.id ? doc.id : this._getId()
        const toSotre = {
            ...this._serialize(doc),
            id,
        }
        this._store[id] = toSotre
        return Promise.resolve(this._instantiate(toSotre))
    }
    saveBulk = (docs: T[]) => {
        return Promise.all(docs.map(this.save))
    }
    getById = (id: string) => {
        const res = this._store[id]
        return Promise.resolve(res ? this._instantiate(res) : null)
    }
    find = <K extends keyof T | 'id'>(
        query: Partial<Record<K, (T & Storable)[K] | Array<(T & Storable)[K]>>>
    ) => {
        const results = Object.values(this._store).filter((doc) => {
            return Object.keys(query).every((k) => {
                if (!isValidQueryKey(k, query)) {
                    return false
                }
                const queryParam = query[k]
                if (Array.isArray(queryParam)) {
                    return queryParam.some((v) => equal(doc[k], v))
                }
                return equal(doc[k], queryParam)
            })
        })
        return Promise.resolve(results.map(this._instantiate))
    }
}

function isValidQueryKey<T>(
    key: string | number | symbol,
    doc: T
): key is keyof T {
    return key in doc
}
