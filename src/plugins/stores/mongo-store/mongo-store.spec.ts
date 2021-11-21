import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoStore } from './mongo-store'
async function run() {
    describe('Mongo store', () => {
        it('stores a value', async () => {
            const store = await setUp()
            const foo = new Foo({ bar: 'ololo' })
            const savedFoo = await store.save(foo)
            const stored = await store.getById(savedFoo.id)
            expect(stored).toEqual(savedFoo)
        })
        it('updates a value', async () => {
            const store = await setUp()
            const foo = new Foo({ bar: 'ololo' })
            const savedFoo = await store.save(foo)
            const update = new Foo({
                id: savedFoo.id,
                bar: 'it is updated',
            })
            await store.save(update)
            const after = await store.getById(savedFoo.id)
            expect(after!.id).toEqual(update.id!)
            expect(after!.bar).toEqual(update.bar)
        })

        it('saves bulk', async () => {
            const store = await setUp()
            const ololo = new Foo({ bar: 'ololo' })
            const baz = new Foo({ bar: 'baz' })
            const saved = await store.saveBulk([ololo, baz])
            expect(saved.length).toEqual(2)
            const got = await Promise.all(saved.map((s) => store.getById(s.id)))
            expect(got).toEqual(saved)
        })
        it('finds values', async () => {
            const store = await setUp()
            const [ololo, ololo2] = await store.saveBulk([
                new Foo({ bar: 'ololo' }),
                new Foo({ bar: 'ololo' }),
                new Foo({ bar: 'doloto' }),
            ])
            await expectAsync(store.find({ bar: 'ololo' })).toBeResolvedTo([
                ololo,
                ololo2,
            ])
        })
        it('finds with AND', async () => {
            const store = await setUp()
            const [ololo, ololo2] = await store.saveBulk([
                new Foo({ bar: 'ololo' }),
                new Foo({ bar: 'ololo' }),
                new Foo({ bar: 'doloto' }),
            ])
            await expectAsync(
                store.find({ bar: 'ololo', id: ololo.id })
            ).toBeResolvedTo([ololo])
        })
        it('finds with OR', async () => {
            const store = await setUp()
            const [ololo, ololo2, ololo3] = await store.saveBulk([
                new Foo({ bar: 'ololo', baz: '1' }),
                new Foo({ bar: 'ololo', baz: '2' }),
                new Foo({ bar: 'ololo', baz: '3' }),
            ])
            await expectAsync(
                store.find({ bar: 'ololo', baz: ['1', '3'] })
            ).toBeResolvedTo([ololo, ololo3])
        })

        it('can work with objects', async () => {
            const store = await setUp()
            const [ololo, ololo2, ololo3] = await store.saveBulk([
                new Foo({ bar: 'ololo', baz: { foo: 1 } }),
                new Foo({ bar: 'ololo', baz: { foo: 2 } }),
                new Foo({ bar: 'ololo', baz: { foo: 2 } }),
            ])
            await expectAsync(
                store.find({ bar: 'ololo', baz: { foo: 2 } })
            ).toBeResolvedTo([ololo2, ololo3])
        })
    })
}

if (process.env.FULL_TEST === 'true') {
    run()
}

async function setUp() {
    const mongod = new MongoMemoryServer()
    const client = new MongoClient(await mongod.getUri(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    await client.connect()
    const database = client.db('test_db-1')
    const collection = await database.createCollection('foos')
    return new MongoStore<Foo>(collection)
}

class Foo {
    id: string | null
    bar: string
    baz: object | string | null = null

    constructor(doc: { id?: string; bar: string; baz?: object | string }) {
        this.id = doc.id || null
        this.bar = doc.bar
        this.baz = doc.baz || null
    }
}
