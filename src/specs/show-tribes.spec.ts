import path from 'path'
import { loadCities } from '../scripts/load-cities'
import { City } from '../use-cases/entities/city'
import { Member } from '../use-cases/entities/member'
import { Storable } from '../use-cases/utils/store'
import { Tribe } from '../use-cases/entities/tribe'
import { User } from '../use-cases/entities/user'
import { TribeShow } from '../use-cases/tribes-show'
import { createContext } from './test-context'

describe('Show tribe(s)', () => {
    it('list tribes for user', async () => {
        const world = await setUp()
        const tribes = await world.tribeShow.getLocalTribes({
            userId: world.user.id,
        })
        expect(tribes.length).toBe(2)
        expect(tribes).toEqual([
            jasmine.objectContaining({
                id: world.tribe.id,
                name: world.tribe.name,
                description: world.tribe.description,
                membersCount: world.members.length,
            }),
            jasmine.objectContaining({
                id: world.tribe2.id,
                name: world.tribe2.name,
                description: world.tribe2.description,
                membersCount: world.members2.length,
            }),
        ])
    })
    it('does NOT show tribes user already in', async () => {
        const world = await setUp()
        const tribeNames = ['foo', 'bar', 'baz', 'quz', 'fizz']
        const tribes = await world.tribeStore.saveBulk(
            tribeNames.map((name) => new Tribe({ name, cityId: world.city.id }))
        )
        await world.memberStore.save(
            new Member({ tribeId: tribes[1].id, userId: world.user.id })
        )
        const result = await world.tribeShow.getLocalTribes({
            userId: world.user.id,
            limit: 5,
        })
        expect(result.length).toBe(5)
        expect(result.map((t) => t.name)).toEqual([
            world.tribe.name,
            world.tribe2.name,
            'foo',
            'baz',
            'quz',
        ])
    })
    it('lists astral', async () => {
        const world = await setUp()
        const tribeNames = ['foo', 'bar', 'baz', 'quz', 'fizz']
        const tribes = await world.tribeStore.saveBulk(
            tribeNames.map((name) => new Tribe({ name }))
        )
        await world.memberStore.save(
            new Member({ tribeId: tribes[1].id, userId: world.user.id })
        )
        const result = await world.tribeShow.getAstralTribes({
            userId: world.user.id,
            limit: 3,
        })
        expect(result.length).toBe(3)
        expect(result.map((t) => t.name)).toEqual(['foo', 'baz', 'quz'])
    })
    it('shows tribes info', async () => {
        const world = await setUp()
        const tribe = await world.tribeShow.getTribeInfo({
            tribeId: world.tribe.id,
            userId: world.user.id,
        })

        expect(tribe).toEqual(
            jasmine.objectContaining({
                id: world.tribe.id,
                name: world.tribe.name,
                description: world.tribe.description,
                membersCount: world.members.length,
            })
        )
    })
    it('Marks inTribe if user is in tribe', async () => {
        const world = await setUp()
        const tribe = await world.tribeShow.getTribeInfo({
            tribeId: world.tribe.id,
            userId: world.users[1].id,
        })
        expect(tribe.isInTribe).toBe(true)
    })
})

async function setUp() {
    const context = await createContext()
    const filePath = path.join(process.cwd(), 'meta/cities.geojson')

    let city: City & Storable
    if (process.env.FULL_TEST) {
        await loadCities(filePath, context.stores.cityStore)
        const cities = await context.stores.cityStore.findSimple({
            name: 'Oslo',
        })
        city = cities[0]
    } else {
        city = await context.stores.cityStore.save(
            new City({ name: 'Oslo', timeZone: 'Europe/Oslo' })
        )
    }
    const user = await context.stores.userStore.save(
        new User({
            name: 'Rual Amudsen',
            cityId: city.id,
        })
    )
    const { tribe, members, users } = await context.testing.makeTribe()
    const { tribe: tribe2, members: members2 } =
        await context.testing.makeTribe(12)
    const { tribe: tribe3 } = await context.testing.makeTribe()
    await context.stores.tribeStore.save({ ...tribe, cityId: city.id })
    await context.stores.tribeStore.save({ ...tribe2, cityId: city.id })

    const tribeShow = new TribeShow(context)

    return {
        tribeShow,
        tribe,
        tribe2,
        tribe3,
        members,
        members2,
        city,
        user,
        users,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
