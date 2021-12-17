import { Store } from '../../../use-cases/entities/store'
import { Collection, FilterQuery, ObjectId } from 'mongodb'
import { objectHasProp } from '../../../ts-utils'

interface Storable {
    id: string
}

export class MongoStore<T extends { id?: string | null }> implements Store<T> {
    protected _class?: new (record: any) => T
    protected _classTable?: Record<string, new (record: any) => T>
    protected _collection: Collection<T>
    protected _instantiate = <TT extends T>(record: any) => {
        let doc = record
        if ('_id' in doc) {
            doc.id = String(doc._id)
            delete doc._id
        }
        let _class = this._class
        // "single table inheritance" can instantiate different classes, based on type field
        if (this._classTable && this._classTable[record.type]) {
            _class = this._classTable[record.type]
        }
        const instance = _class ? new _class(doc) : { ...doc }
        return instance as TT & Storable
    }
    protected _log = (...args: any[]) => {
        console.log(`${this.constructor.name}: `, ...args)
    }

    constructor(collection: Collection) {
        this._collection = collection
    }

    save = async <TT extends T>(doc: TT | (TT & Storable)) => {
        if (stored(doc)) {
            const { id, ...rest } = doc
            const res = await this._collection.updateOne(
                { _id: toId(doc) } as any,
                { $set: { ...rest } } as any
            )
            if (res.result.ok !== 1) {
                throw new Error("Didn't save for some reason")
            }
            return doc
        }
        delete doc.id
        const res = await this._collection.insertOne(doc as any)
        if (res.result.ok !== 1) {
            throw new Error("Didn't save for some reason")
        }

        return this._instantiate<TT>({ ...res.ops[0], id: res.insertedId })
    }
    saveBulk = async <TT extends T>(docs: Array<TT | (TT & Storable)>) => {
        const updates: Array<TT & Storable> = []
        const inserts: T[] = []
        for (let doc of docs) {
            if (stored(doc)) {
                updates.push(doc)
            } else {
                inserts.push(doc)
            }
        }
        const res: Array<TT & Storable> = []
        if (inserts.length) {
            const insRes = await this._collection.insertMany(inserts as any)
            insRes.ops.forEach((doc) => {
                res.push(this._instantiate(doc))
            })
        }
        if (updates.length) {
            for (let upd of updates) {
                res.push(await this.save(upd))
            }
        }
        return res
    }
    getById = async (id: string) => {
        const res = await this._collection.findOne({ _id: toId({ id }) } as any)
        return res ? this._instantiate(res) : null
    }
    find: Store<T>['find'] = async (query, filter, { limit = 100, cursor }) => {
        let q: any = toQuery(objectify(query))
        let f: any = Object.entries(objectify(filter)).reduce(
            (res, [key, value]) => {
                if (key === '_id') return { ...res, [key]: { $not: value } }
                if (Array.isArray(value)) {
                    return { ...res, [key]: { $not: { $in: value } } }
                }
                return { ...res, [key]: { $not: value } }
            },
            {}
        )
        if (cursor) {
            q = { $and: [q, f, { _id: { $gt: toId({ id: cursor }) } }] }
        } else {
            q = { $and: [q, f] }
        }

        const c = this._collection
            .find(q)
            .limit(limit)
            .map((d) => this._instantiate(d))
        const res = await c.toArray()
        await c.close()
        return res
    }
    findSimple: Store<T>['findSimple'] = async (query) => {
        const c = this._collection
            .find(toQuery(objectify(query)))
            .map((d) => this._instantiate(d))
        const res = await c.toArray()
        await c.close()
        return res
    }
    _last = async () => {
        const res = await this._collection
            .find()
            .sort({ _id: -1 })
            .limit(1)
            .toArray()

        if (!res.length) {
            throw new Error(
                `Cannot get last record of empty ${this.constructor.name}`
            )
        }
        return this._instantiate(res[0])
    }

    __show = async (keys?: Array<keyof T | 'id'>) => {
        const cursor = this._collection
            .find()
            .map(({ _id, ...d }: any) => ({ ...d, id: String(_id) }))
        let cursor2 = cursor
        if (keys) {
            const projection = keys.reduce((r, k) => ({ ...r, [k]: 1 }), {})
            cursor2 = cursor.project(projection)
        }
        const res = await cursor2.toArray()
        console.log(`\n${this.constructor.name}:`)
        console.table(res)
        console.log('\n')
    }
}

function stored(doc: any): doc is Storable {
    return 'id' in doc && doc.id
}

function toId(doc: Storable) {
    try {
        return new ObjectId(doc.id)
    } catch (e) {
        if (!/must be a single String of 12 bytes/.test(String(e))) {
            console.warn(e)
        }
        return null
    }
}

function objectify<T extends {}>(doc: T) {
    if (objectHasProp(doc, 'id')) {
        if (typeof doc.id === 'string') {
            const { id, ...rest } = doc
            return {
                _id: toId({ id }),
                ...rest,
            }
        } else if (Array.isArray(doc.id)) {
            const { id, ...rest } = doc
            return {
                _id: { $in: id.map((i) => toId({ id: i })) },
                ...rest,
            }
        }
    }
    return doc
}

function toQuery(doc: any): FilterQuery<any> {
    return Object.entries(doc).reduce((res, [key, value]) => {
        if (key === '_id') return { ...res, [key]: value }
        if (Array.isArray(value)) {
            return { ...res, [key]: { $in: value } }
        }
        return { ...res, [key]: value }
    }, {})
}
