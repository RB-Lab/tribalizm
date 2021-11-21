import { Store } from '../../../use-cases/entities/store'

interface Storable {
    id: string
}
export class InMemoryStore<T> implements Store<T> {
    protected _store: Record<string, any> = {}
    private _getId = () => Math.random().toString().slice(2)
    private _class?: new (record: any) => T
    protected _instantiate = (record: any) => {
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
        console.log(`${this.constructor.name}: `, ...args)
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
            return check(query, doc)
        })
        return Promise.resolve(results.map(this._instantiate))
    }
    _last = async () => {
        const values = Object.values(this._store)
        return values.length
            ? (values[values.length - 1] as T & Storable)
            : null
    }

    __show = (keys?: Array<keyof T | 'id'>) => {
        console.log(`\n${this.constructor.name}:`)
        if (keys) {
            const toShow = Object.values(this._store).map((o: T & Storable) =>
                keys.reduce((r, k) => ({ ...r, [k]: o[k] }), {})
            )
            console.table(toShow)
        } else {
            console.table(Object.values(this._store))
        }
        console.log('\n')
    }
}

function check(query: any, doc: any): boolean {
    return Object.keys(query).every((k) => {
        const queryParam = query[k]
        if (Array.isArray(queryParam)) {
            return queryParam.some((subQuery) => check(subQuery, doc[k]))
        } else if (typeof queryParam === 'object' && queryParam !== null) {
            return check(queryParam, doc[k])
        }
        return queryParam === doc[k]
    })
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
