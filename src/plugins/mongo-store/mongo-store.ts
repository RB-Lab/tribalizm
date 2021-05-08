import { Store } from '../../use-cases/entities/store'
import { Collection, ObjectId } from 'mongodb'

interface Storable {
    id: string
}
const defaultPage = { fields: 'id', limit: 100, order: 'asc' as 'asc' | 'desc' }

export class MongoStore<T> implements Store<T> {
    private _class?: new (record: any) => T
    protected _collection: Collection<T>
    protected _instantiate = (record: any) => {
        let doc = record
        if ('_id' in doc) {
            doc.id = String(doc._id)
            delete doc._id
        }
        const instance = this._class ? new this._class(doc) : { ...doc }
        return instance as T & Storable
    }
    protected _log = (...args: any[]) => {
        console.log(`${this.constructor.name}: `, ...args)
    }

    constructor(collection: Collection, _class?: new (record: any) => T) {
        this._class = _class
        this._collection = collection
    }

    save = async (doc: T | (T & Storable)) => {
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
        const res = await this._collection.insertOne(doc as any)
        if (res.result.ok !== 1) {
            throw new Error("Didn't save for some reason")
        }

        return this._instantiate({ ...res.ops[0], id: res.insertedId })
    }
    saveBulk = async (docs: Array<T | (Storable & T)>) => {
        const updates: Array<Storable & T> = []
        const inserts: T[] = []
        for (let doc of docs) {
            if (stored(doc)) {
                updates.push(doc)
            } else {
                inserts.push(doc)
            }
        }
        const res: Array<Storable & T> = []
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
    find: Store<T>['find'] = async (query, { limit = 100, cursor } = {}) => {
        let q: any = query
        if (cursor) {
            q = { ...query, $gt: { _id: new ObjectId(cursor) } }
        }
        q = Object.entries(q).reduce((res, [key, value]) => {
            if (key === 'id') {
                key = '_id'
                if (Array.isArray(value)) {
                    value = value.map((v) => new ObjectId(v))
                } else {
                    value = new ObjectId(value as string)
                }
            }
            if (Array.isArray(value)) {
                return { ...res, [key]: { $in: value } }
            }
            return { ...res, [key]: value }
        }, {})
        const c = this._collection
            .find(q)
            .limit(limit)
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
        return res[0] ? this._instantiate(res[0]) : null
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
