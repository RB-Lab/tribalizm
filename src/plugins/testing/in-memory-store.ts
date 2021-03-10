import * as equal from 'fast-deep-equal'
import { Store } from '../../use-cases/entities/store'

interface Storable {
    id: string
}
export class InMemoryStore<T> implements Store<T> {
    protected _store: Record<string, any> = {}
    private _getId = () => Math.random().toString().slice(2)
    private _class?: new (record: any) => T
    private _instantiate = (record: any) => {
        const instance = this._class ? new this._class(record) : { ...record }
        return instance as T & Storable
    }
    private _serialize = (doc: any) => {
        return getKeys(doc).reduce((res, key) => {
            const value = doc[key]
            if (typeof value === 'function') {
                return res
            }
            return { ...res, [key]: value }
        }, {})
    }
    protected _log = (...args: any[]) => {
        const name = console.log(`${this.constructor.name}: `, ...args)
    }

    constructor(_class?: new (record: any) => T) {
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
    find: Store<T>['find'] = (query) => {
        const results = Object.values(this._store).filter((doc) => {
            return Object.keys(query).every((k) => {
                if (!isValidObjectKey(k, query)) {
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

    __show = () => {
        console.table(Object.values(this._store))
    }
}

export function isValidObjectKey<T>(
    key: string | number | symbol,
    doc: T
): key is keyof T {
    return key in doc
}

export function getKeys<T extends object>(doc: T) {
    const keys = [
        ...Object.keys(
            Object.getOwnPropertyDescriptors(Object.getPrototypeOf(doc))
        ),
        ...Object.keys(doc),
    ]

    return Array.from(new Set(keys)).filter(
        (k) => !(k.startsWith('_') || k === 'constructor')
    )
}
