import { InMemoryStore } from './in-memory-store'

describe('In memory store', () => {
    it('stores a value', async () => {
        const store = new FooStore()
        const foo = new Foo({ bar: 'ololo' })
        const savedFoo = await store.save(foo)
        await expectAsync(store.getById(savedFoo.id)).toBeResolvedTo(savedFoo)
    })
    it('updates a value', async () => {
        const store = new FooStore()
        const foo = new Foo({ bar: 'ololo' })
        const savedFoo = await store.save(foo)
        const update = new Foo({
            id: savedFoo.id,
            bar: 'it is updated',
        })
        await store.save(update)
        const after = await store.getById(savedFoo.id)
        expect(after?.id).toEqual(update.id!)
        expect(after?.bar).toEqual(update.bar)
    })
    it('stores non-getters', async () => {
        class FooBar {
            id: string | null
            nor: string
            constructor(doc: { id?: string; nor: string }) {
                this.id = doc.id || null
                this.nor = doc.nor
            }
        }
        const store = new InMemoryStore<FooBar>()
        const foo = new FooBar({ nor: 'ololo' })
        const savedFoo = await store.save(foo)
        await expectAsync(store.getById(savedFoo.id)).toBeResolvedTo(savedFoo)
    })
    it('saves bulk', async () => {
        const store = new FooStore()
        const ololo = new Foo({ bar: 'ololo' })
        const baz = new Foo({ bar: 'baz' })
        const saved = await store.saveBulk([ololo, baz])
        expect(saved.length).toEqual(2)
        const got = await Promise.all(saved.map((s) => store.getById(s.id)))
        expect(got).toEqual(saved)
    })
    it('finds values', async () => {
        const store = new FooStore()
        const ololo = new Foo({ id: '1', bar: 'ololo' })
        const ololo2 = new Foo({ id: '2', bar: 'ololo' })
        await store.saveBulk([ololo, ololo2])
        await expectAsync(store.find({ bar: 'ololo' }) as any).toBeResolvedTo([
            ololo,
            ololo2,
        ])
    })
    it('finds with AND', async () => {
        const store = new FooStore()
        const ololo = new Foo({ id: '1', bar: 'ololo' })
        const ololo2 = new Foo({ id: '2', bar: 'ololo' })
        await store.saveBulk([ololo, ololo2])
        await expectAsync(
            store.find({ bar: 'ololo', id: '1' }) as any
        ).toBeResolvedTo([ololo])
    })
    it('finds with OR', async () => {
        const store = new FooStore()
        const ololo = new Foo({ id: '1', bar: 'ololo' })
        const ololo2 = new Foo({ id: '2', bar: 'ololo' })
        const ololo3 = new Foo({ id: '3', bar: 'ololo' })
        await store.saveBulk([ololo, ololo2, ololo3])
        await expectAsync(
            store.find({ bar: 'ololo', id: ['1', '3'] }) as any
        ).toBeResolvedTo([ololo, ololo3])
    })

    it('can work with objects', async () => {
        const store = new FooStore()
        const ololo = new Foo({ id: '1', bar: 'ololo', baz: { foo: 1 } })
        const ololo2 = new Foo({ id: '2', bar: 'ololo', baz: { foo: 2 } })
        const ololo3 = new Foo({
            id: '3',
            bar: 'ololo',
            baz: { foo: 2, quak: 'oops' },
        })
        await store.saveBulk([ololo, ololo2, ololo3])
        await expectAsync(
            store.find({ bar: 'ololo', baz: { foo: 2 } }) as any
        ).toBeResolvedTo([ololo2, ololo3])
    })
})

class FooStore extends InMemoryStore<Foo> {
    _class = Foo
}

class Foo {
    private _id: string | null
    get id() {
        return this._id
    }
    private _bar: string
    get bar() {
        return this._bar
    }
    private _baz: object | null = null
    get baz() {
        return this._baz
    }

    constructor(doc: { id?: string; bar: string; baz?: object }) {
        this._id = doc.id || null
        this._bar = doc.bar
        this._baz = doc.baz || null
    }
}
