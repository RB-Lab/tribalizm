import { purgeGlobalCallbackRegistry } from '../../plugins/ui/telegram/screens/callback-parser'
import { Awaited } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { SavedTribe, Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import { createTelegramContext, getInlineKeyCallbacks } from './bot-utils'

describe('Astral tribes [scenario]:', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date('2021-11-16'))
        world = await setup()
        // process.env.chatDebug = 'true'
    })
    afterEach(async () => {
        jasmine.clock().uninstall()
        await world.tearDown()
        process.env.chatDebug = ''
        purgeGlobalCallbackRegistry()
    })
    it('Create tribe', async () => {
        const update = await world.user1.chatLast('/start')
        const user = await world.context.stores.userStore._last()
        const listOrRules = getInlineKeyCallbacks(update)
        await world.user1.chat(listOrRules[0])
        const tribesListUpdate = await world.user1.chat(world.baku.name)
        expect(tribesListUpdate.length).toBe(2)
        const checkAstral = getInlineKeyCallbacks(tribesListUpdate[1])
        expect(checkAstral.length).toBe(1)
        const astralUpds = await world.user1.chat(checkAstral[0])
        expect(astralUpds.length).toBe(1)
        const create = getInlineKeyCallbacks(astralUpds[0])[0]
        expect(create).toEqual(jasmine.any(String))
        await world.user1.chat(create)
        await world.user1.chat('Bar Tribe')
        await world.user1.chat('We really Bar Bar!')
        const tribes = await world.context.stores.tribeStore.findSimple({})
        expect(tribes.length).toBe(1)
        expect(tribes[0]).toEqual(
            jasmine.objectContaining<Tribe>({
                name: 'Bar Tribe',
                description: 'We really Bar Bar!',
                cityId: null,
                chiefId: jasmine.any(String),
            })
        )
        const members = await world.context.stores.memberStore.findSimple({})
        expect(members.length).toBe(1)
        expect(members[0].userId).toBe(user.id)
        expect(tribes[0].chiefId).toBe(members[0].id)
    })
    it('List tribes', async () => {
        const tribes = await world.create5tribes()
        await world.addTribeMember(world.user1, tribes[0].id)
        const update = await world.user1.chatLast('/start')
        const listOrRules = getInlineKeyCallbacks(update)
        await world.user1.chat(listOrRules[0])
        const tribesListUpdate = await world.user1.chat(world.baku.name)
        const checkAstral = getInlineKeyCallbacks(tribesListUpdate[1])
        expect(checkAstral.length).toBe(1)
        const astralUpds = await world.user1.chat(checkAstral[0])
        expect(astralUpds.length).toBe(5)

        for (let i of [1, 2, 3]) {
            // user1 is member of first tribe, so it must be skipped
            expect(astralUpds[i].message.text).toMatch(tribes[i].name)
        }
        const loadMore = getInlineKeyCallbacks(astralUpds[4])
        expect(loadMore.length).toBe(1)
        const nextTribesListUpdate = await world.user1.chat(loadMore[0])
        expect(nextTribesListUpdate.length).toBe(2)
        expect(nextTribesListUpdate[0].message.text).toMatch(tribes[4].name)

        const create = getInlineKeyCallbacks(nextTribesListUpdate[1])[0]
        expect(create).toMatch('create')
    })

    it('Sets correct time for initiation for users in different timezones', async () => {
        // first user creates tribe
        const update = await world.user1.chatLast('/start')
        const listOrRules = getInlineKeyCallbacks(update)
        await world.user1.chat(listOrRules[0])
        const tribesListUpdate = await world.user1.chat(world.baku.name)
        const checkAstral = getInlineKeyCallbacks(tribesListUpdate[1])
        const astralUpds = await world.user1.chat(checkAstral[0])
        const create = getInlineKeyCallbacks(astralUpds[0])[0]
        await world.user1.chat(create)
        await world.user1.chat('Bar Tribe')
        await world.user1.chat('We really Bar Bar!')

        // second user applies to that tribe
        const listOrRules2 = getInlineKeyCallbacks(
            await world.user2.chatLast('/start')
        )
        await world.user2.chat(listOrRules2[0])
        const checkAstral2 = getInlineKeyCallbacks(
            (await world.user2.chat(world.seoul.name))[1]
        )
        const astralUpds2 = await world.user2.chat(checkAstral2[0])
        const applyKeyboard = getInlineKeyCallbacks(astralUpds2[1])
        await world.user2.forceCallback(applyKeyboard[0])
        await world.user2.chat('Because I BAR')

        const meetOrDecline = getInlineKeyCallbacks(
            await world.user1.chatLast()
        )
        const calendar = getInlineKeyCallbacks(
            await world.user1.chatLast(meetOrDecline[0])
        )

        const dates = calendar.filter((cb) => cb.includes('date'))

        const hour = getInlineKeyCallbacks(
            await world.user1.chatLast(dates[1], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await world.user1.chatLast(hour, true)
        )[2]
        await world.user1.chat(minutes, true)
        const proposalConfirmPrompt = await world.user1.chatLast('Bar-Bar bar')
        const proposalPromptButtons = getInlineKeyCallbacks(
            proposalConfirmPrompt
        )
        // next day
        expect(proposalConfirmPrompt.message.text).toMatch('17')
        // time
        expect(proposalConfirmPrompt.message.text).toMatch('12:30')

        await world.user1.chat(proposalPromptButtons[0], true)

        const meetingNotif = await world.user2.chatLast()

        // same day
        expect(meetingNotif.message.text).toMatch('17')
        // Seoul is UTC+9, Baku is UTC+4 ⇒ 12:30 - (4 + 9)
        expect(meetingNotif.message.text).toMatch('5:30 PM')
    })

    it('List tribes in city and then check Astral', async () => {
        pending('Needs implementation')
    })
})

async function setup() {
    const context = await createContext()
    const { server, makeClient, bot, addTribeMember } =
        await createTelegramContext(context)

    const baku = await context.stores.cityStore.save(
        new City({
            name: 'Baku',
            timeZone: 'Asia/Baku',
        })
    )

    const seoul = await context.stores.cityStore.save(
        new City({
            name: 'Seoul',
            timeZone: 'Asia/Seoul',
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

    const user1 = makeClient('User-1', 'User-1')
    const user2 = makeClient('User-2', 'User-2')
    return {
        baku,
        seoul,
        context,
        addTribeMember,
        create5tribes,
        user1,
        user2,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
