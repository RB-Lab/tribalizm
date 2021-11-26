import { StoredBotUpdate } from 'telegram-test-api/lib/telegramServer'
import { Awaited } from '../../ts-utils'
import { Admin } from '../../use-cases/admin'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import { createTelegramContext, getInlineKeyCallbacks } from './bot-utils'

function xdescribe(...args: any[]) {}
describe('Brainstorm [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date('2021-11-02'))
        world = await setup()
        // process.env.chatDebug = 'true'
    })
    afterEach(async () => {
        await world.tearDown()
        jasmine.clock().uninstall()
    })

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

        jasmine.clock().mockDate(new Date(tasks[0].time + 1000))
        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to the time of first reminder (5 mins)
        jasmine.clock().mockDate(new Date(tasks[1].time + 1000))
        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to brainstorm start time
        jasmine.clock().mockDate(new Date(tasks[2].time + 1000))
        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
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

        // Fast forward to the voting phase of the storm
        const overTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(overTask!.time + 1000))
        await world.context.requestTaskQueue()
        // all users notified that it is time to vote
        for (let u of [...world.notChiefUsers, world.chief]) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
        // should add buttons to ideas
        const updIds = ideas.map((i) => i.updateId)
        const updHst = await world.chief.client.getUpdatesHistory()
        const upds = updHst.filter((u) => updIds.includes(u.updateId))
        for (let upd of upds) {
            expect(getInlineKeyCallbacks(upd as any).length).toBe(2)
        }

        // everybody votes for second idea
        const lastIdea = await world.context.stores.ideaStore._last()
        for (let user of [world.chief, ...world.notChiefUsers]) {
            for (let upd of upds) {
                if (
                    String((upd as StoredBotUpdate).message.chat_id) ===
                    String((user.client as any).chatId)
                ) {
                    const btnUp = getInlineKeyCallbacks(upd as any)[0]
                    if (btnUp.includes(lastIdea!.id)) {
                        await user.forceCallback(btnUp, true)
                    }
                }
            }
        }
        const updIdea = await world.context.stores.ideaStore._last()
        expect(updIdea?.votes.length).toBe(4)

        // Fast forward to the end of the storm
        const endTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(endTask!.time + 1000))
        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of [...world.notChiefUsers, world.chief]) {
            if (u === world.user3) continue
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
        process.env.chatDebug = 'true'
        // user 3, that suggested the most popular idea is to coordinate it with chief
        const coordinateUpd = await world.user3.chatLast()
        expect(coordinateUpd).toBeTruthy()
        const okay = getInlineKeyCallbacks(coordinateUpd)[0]
        const calendar2 = await world.user3.chatLast(okay)
        const dates2 = getInlineKeyCallbacks(calendar2).filter((cb) =>
            cb.includes('date')
        )
        const hour2 = getInlineKeyCallbacks(
            await world.user3.chatLast(dates2[3], true)
        )[4]
        const minutes2 = getInlineKeyCallbacks(
            await world.user3.chatLast(hour2, true)
        )[2]
        await world.user3.chat(minutes2, true)
        await world.user3.chatLast('Tarantuga Inn')
        await world.user3.chat('confirm-proposal', true)

        // check that quest negotiation works on coordination quests as well
        // new user recieves proposal
        const chiefNotif = await world.chief.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(chiefNotif)
        const propose3 = userNotifButtons.find((b) => b.startsWith('change'))
        const calendar3 = await world.chief.chatLast(propose3!)
        const dates3 = getInlineKeyCallbacks(calendar3).filter((cb) =>
            cb.includes('date')
        )
        const hour3 = getInlineKeyCallbacks(
            await world.chief.chatLast(dates3[6]!, true)
        )[6]
        const minutes3 = getInlineKeyCallbacks(
            await world.chief.chatLast(hour3, true)
        )[0]
        await world.chief.chat(minutes3, true)
        await world.chief.chatLast('Go Bar-Bar bar!')
        await world.chief.chat('confirm-proposal', true)
        const reProposeUpd = await world.user3.chat()
        const reProposedButtons = getInlineKeyCallbacks(reProposeUpd[0])
        await world.user3.chat(reProposedButtons[0])
        // get "agreed on quest + buttons"
        const chiefConfirmUpd = await world.chief.chat()
        expect(chiefConfirmUpd.length).toBe(2)
        const spawnButtons = getInlineKeyCallbacks(chiefConfirmUpd[1])
        expect(spawnButtons).toEqual([
            jasmine.stringMatching('spawn-quest'),
            jasmine.stringMatching('re-quest'),
            jasmine.stringMatching('declare-gathering'),
            jasmine.stringMatching('declare-gathering'),
        ])
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
