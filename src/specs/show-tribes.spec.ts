import { loadCities } from '../scripts/load-cities'
import { City } from '../use-cases/entities/city'
import { Storable } from '../use-cases/entities/store'
import { User } from '../use-cases/entities/user'
import { TribeShow } from '../use-cases/tribes-show'
import { createContext } from './test-context'

describe('Show tribe(s)', () => {
    it('list tribes for coordinates', async () => {
        const world = await setUp()
        const tribes = await world.tribeShow.getLocalTribes({
            userId: world.user.id,
        })
        expect(tribes.length).toBe(2)
        expect(tribes).toEqual(
            jasmine.arrayContaining([
                {
                    id: world.tribe.id,
                    name: world.tribe.name,
                    description: world.tribe.description,
                    type: world.tribe.vocabulary,
                    membersCount: world.members.length,
                },
                {
                    id: world.tribe2.id,
                    name: world.tribe2.name,
                    description: world.tribe2.description,
                    type: world.tribe2.vocabulary,
                    membersCount: world.members2.length,
                },
            ])
        )
    })
    it('shows tribes info', async () => {
        const world = await setUp()
        const tribe = await world.tribeShow.getTribeInfo({
            tribeId: world.tribe.id,
        })
        const chief = world.members.find((m) => m.id === world.tribe.chiefId)
        const chiefUser = world.users.find((u) => u.id === chief!.userId)
        expect(tribe).toEqual(
            jasmine.objectContaining({
                id: world.tribe.id,
                name: world.tribe.name,
                description: world.tribe.description,
                type: world.tribe.vocabulary,
                membersCount: world.members.length,
                chief: {
                    name: chiefUser!.name,
                },
            })
        )
    })
})

async function setUp() {
    const context = await createContext()

    let city: City & Storable
    if (process.env.FULL_TEST) {
        await loadCities('meta/cities.geojson', context.stores.cityStore)
        const cities = await context.stores.cityStore.find({ name: 'Oslo' })
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
        user,
        users,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
