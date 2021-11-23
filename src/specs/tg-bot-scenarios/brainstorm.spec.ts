import exp from 'constants'
import { StoredBotUpdate } from 'telegram-test-api/lib/telegramServer'
import { Awaited } from '../../ts-utils'
import { Admin } from '../../use-cases/admin'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import {
    createTelegramContext,
    debugKeyboard,
    getInlineKeyCallbacks,
} from './bot-utils'

function xdescribe(...args: any[]) {}
describe('Brainstorm [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        world = await setup()
    })
    afterEach(async () => {
        await world.tearDown()
    })

    // process.env.chatDebug = 'true'
    fit('Main scenario', async () => {
        // Chief arranges brainstorm
        await world.admin.notifyBrainstorm({ memberId: world.chief.member.id })
        const chiefBrstmNoteUpd = await world.chief.chat()
        expect(chiefBrstmNoteUpd.length).toBe(1)
        const brstBtns = getInlineKeyCallbacks(chiefBrstmNoteUpd[0])
        expect(brstBtns.length).toBe(1)
        const calendar = await world.chief.chatLast(brstBtns[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        const hour = getInlineKeyCallbacks(
            await world.chief.chatLast(dates[3], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await world.chief.chatLast(hour, true)
        )[2]
        const confirmUpd = await world.chief.chatLast(minutes, true)
        const confirmBtns = getInlineKeyCallbacks(confirmUpd)
        await world.chief.chat(confirmBtns[0])

        const tasks = await world.context.stores.taskStore.find({})
        expect(tasks.length).toBe(3)
        tasks.sort((t1, t2) => t1.time - t2.time)

        // All members are notified
        for (let u of world.notChiefUsers) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to the time of first reminder (half-day)

        jasmine.clock().install()
        jasmine.clock().mockDate(new Date(tasks[0].time + 1000))
        await world.context.requestTaskQueue()
        jasmine.clock().uninstall()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to the time of first reminder (5 mins)
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date(tasks[1].time + 1000))
        await world.context.requestTaskQueue()
        jasmine.clock().uninstall()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to brainstorm start time
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date(tasks[2].time + 1000))
        await world.context.requestTaskQueue()
        jasmine.clock().uninstall()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
        process.env.chatDebug = 'true'
        const ideas: StoredBotUpdate[] = []
        // user 2 adds idea
        const idea1 = "Let's go FOOOO!!"
        await world.user2.client.sendMessage(
            world.user2.client.makeMessage(idea1)
        )
        ideas.push(await world.chief.chatLast())
        ideas.push(await world.shaman.chatLast())
        ideas.push(await world.user1.chatLast())
        ideas.push(await world.user3.chatLast())

        expect(ideas.length).toBe(4)
        for (let idea of ideas) {
            expect(idea.message.text).toMatch(idea1)
        }

        await world.user3.client.sendMessage(
            world.user3.client.makeMessage("Let's go Arr!!")
        )
        ideas.push(await world.chief.chatLast())
        ideas.push(await world.shaman.chatLast())
        ideas.push(await world.user1.chatLast())
        ideas.push(await world.user2.chatLast())
    })
})
async function setup() {
    const context = await createContext()
    const { server, addTribeMember, makeClient, bot } =
        await createTelegramContext(context)

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Novosibirsk',
        })
    )
    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            cityId: city.id,
            name: 'Foo Tribe',
            description: 'We love to FOOO!!!',
        })
    )

    const chief = await addTribeMember(
        makeClient('FooRious', 'Tribe Chief'),
        tribe.id
    )
    await context.addVotes(chief.member, 5, 3)
    const shaman = await addTribeMember(
        makeClient('Dart Foor', 'Tribe Shaman'),
        tribe.id
    )
    await context.addVotes(shaman.member, 3, 5)
    const user1 = await addTribeMember(
        makeClient('Fooer 1', 'User 1'),
        tribe.id
    )
    const user2 = await addTribeMember(
        makeClient('Fooer 2', 'User 2'),
        tribe.id
    )
    const user3 = await addTribeMember(
        makeClient('Fooer 3', 'User 3'),
        tribe.id
    )

    await context.stores.tribeStore.save({
        ...tribe,
        chiefId: chief.member.id,
        shamanId: shaman.member.id,
    })

    return {
        admin: new Admin(context),
        tribe,
        chief,
        shaman,
        user1,
        user2,
        user3,
        notChiefUsers: [shaman, user1, user2, user3],
        city,
        context,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
