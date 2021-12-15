import { purgeGlobalCallbackRegistry } from '../../plugins/ui/telegram/screens/callback-parser'
import { Awaited } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { SavedTribe, Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import { createTelegramContext, getInlineKeyCallbacks } from './bot-utils'

describe('Astral tribes [scenario]:', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        world = await setup()
        // process.env.chatDebug = 'true'
    })
    afterEach(async () => {
        await world.tearDown()
        process.env.chatDebug = ''
        purgeGlobalCallbackRegistry()
    })
    it('Create tribe', async () => {
        const update = await world.newUser.chatLast('/start')
        const user = await world.context.stores.userStore._last()
        const listOrRules = getInlineKeyCallbacks(update)
        await world.newUser.chat(listOrRules[0])
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        expect(tribesListUpdate.length).toBe(2)
        const checkAstral = getInlineKeyCallbacks(tribesListUpdate[1])
        expect(checkAstral.length).toBe(1)
        const astralUpds = await world.newUser.chat(checkAstral[0])
        expect(astralUpds.length).toBe(1)
        const create = getInlineKeyCallbacks(astralUpds[0])[0]
        expect(create).toEqual(jasmine.any(String))
        await world.newUser.chat(create)
        await world.newUser.chat('Bar Tribe')
        await world.newUser.chat('We really Bar Bar!')
        const tribes = await world.context.stores.tribeStore.find({})
        expect(tribes.length).toBe(1)
        expect(tribes[0]).toEqual(
            jasmine.objectContaining<Tribe>({
                name: 'Bar Tribe',
                description: 'We really Bar Bar!',
                cityId: null,
                chiefId: jasmine.any(String),
            })
        )
        const members = await world.context.stores.memberStore.find({})
        expect(members.length).toBe(1)
        expect(members[0].userId).toBe(user.id)
        expect(tribes[0].chiefId).toBe(members[0].id)
    })
    it('List tribes', async () => {
        const tribes = await world.create5tribes()
        const update = await world.newUser.chatLast('/start')
        const listOrRules = getInlineKeyCallbacks(update)
        await world.newUser.chat(listOrRules[0])
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        const checkAstral = getInlineKeyCallbacks(tribesListUpdate[1])
        expect(checkAstral.length).toBe(1)
        const astralUpds = await world.newUser.chat(checkAstral[0])
        expect(astralUpds.length).toBe(5)
        for (let i of [1, 2, 3]) {
            expect(astralUpds[i].message.text).toMatch(tribes[i - 1].name)
        }
        const loadMore = getInlineKeyCallbacks(astralUpds[4])
        expect(loadMore.length).toBe(1)
        const nextTribesListUpdate = await world.newUser.chat(loadMore[0])
        expect(nextTribesListUpdate.length).toBe(3)
        for (let i of [0, 1]) {
            expect(nextTribesListUpdate[i].message.text).toMatch(
                tribes[i + 3].name
            )
        }

        const create = getInlineKeyCallbacks(nextTribesListUpdate[2])[0]
        expect(create).toMatch('create')
    })
    it('List list tribes in city and then check Astral', async () => {
        pending('Needs implementation')
    })
})

async function setup() {
    const context = await createContext()
    const { server, makeClient, bot } = await createTelegramContext(context)

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Novosibirsk',
            timeZone: 'Asia/Novosibirsk',
        })
    )
    async function create5tribes() {
        await context.stores.tribeStore.save(
            new Tribe({
                name: 'Ololo tribe',
                description: "It's a bit trickier!",
                cityId: 'any city',
            })
        )
        const tribeNames = ['FOO', 'BAR', 'BAZ', 'QUAZ', 'FIZzz']
        const tribes: SavedTribe[] = []
        for (let name of tribeNames) {
            tribes.push(
                await context.stores.tribeStore.save(
                    new Tribe({
                        name: `The ${name} tribe`,
                        description: `We really ${name}!!`,
                    })
                )
            )
        }
        return tribes
    }

    const newUser = makeClient('Newbie', 'Applicant')
    return {
        city,
        context,
        create5tribes,
        newUser,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
