import { Page, Query, Store } from '../../../use-cases/entities/store'

interface Storable {
    id: string
}

export class InMemoryStore<T> implements Store<T> {
    protected _store: Record<string, any> = {}
    private _getId = () => Math.random().toString().slice(2)
    protected _class?: new (record: any) => T
    protected _classTable?: Record<string, new (record: any) => T>
    protected _instantiate = <TT extends T>(record: any) => {
        let _class = this._class
        // "single table inheritance" can instantiate different classes, based on type field
        if (this._classTable && this._classTable[record.type]) {
            _class = this._classTable[record.type]
        }
        const instance = _class ? new _class(record) : { ...record }
        return instance as TT & Storable
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

    save = <TT extends T>(doc: TT | (TT & Storable)) => {
        const id = 'id' in doc && doc.id ? doc.id : this._getId()
        const toStore = {
            ...this._serialize(doc),
            id,
        }
        this._store[id] = toStore

        return Promise.resolve(this._instantiate<TT>(toStore))
    }
    saveBulk = <TT extends T>(docs: TT[]) => {
        return Promise.all(docs.map(this.save))
    }
    getById = (id: string) => {
        const res = this._store[id]
        return Promise.resolve(res ? this._instantiate(res) : null)
    }

    find: Store<T>['find'] = (query, filter, { cursor, limit = 100 }) => {
        const storeValues = Object.values(this._store)
        const results = storeValues.filter(
            (doc) => check(query, doc) && checkNot(filter, doc)
        )

        const index = cursor ? storeValues.findIndex((o) => o.id === cursor) : 0

        return Promise.resolve(
            results.slice(index, index + limit).map(this._instantiate)
        )
    }
    findSimple: Store<T>['findSimple'] = (query) => {
        const storeValues = Object.values(this._store)
        let results = storeValues.filter((doc) => check(query, doc))
        return Promise.resolve(results.map(this._instantiate))
    }
    _last = async () => {
        const values = Object.values(this._store)
        if (!values.length) {
            throw new Error(
                `Cannot get last record of empty ${this.constructor.name}`
            )
        }
        return this._instantiate(values[values.length - 1])
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
    return Object.keys(query).every((key) => {
        const queryParam = query[key]
        if (Array.isArray(queryParam)) {
            return queryParam.some((subQuery) => check(subQuery, doc[key]))
        } else if (typeof queryParam === 'object' && queryParam !== null) {
            return check(queryParam, doc[key])
        }
        return queryParam === doc[key]
    })
}
function checkNot(query: any, doc: any): boolean {
    return Object.keys(query).every((key) => {
        const queryParam = query[key]
        if (Array.isArray(queryParam)) {
            return !queryParam.some((subQuery) => check(subQuery, doc[key]))
        } else if (typeof queryParam === 'object' && queryParam !== null) {
            return !check(queryParam, doc[key])
        }
        return queryParam !== doc[key]
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
