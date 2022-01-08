import { StoredBotUpdate } from 'telegram-test-api/lib/telegramServer'
import { purgeGlobalCallbackRegistry } from '../../plugins/ui/telegram/screens/callback-parser'
import { Awaited, noop } from '../../ts-utils'
import { Admin } from '../../use-cases/admin'
import { City } from '../../use-cases/entities/city'
import { QuestType } from '../../use-cases/entities/quest'
import { Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import { createTelegramContext, getInlineKeyCallbacks } from './bot-utils'

const xdescribe = noop
xdescribe('Brainstorm [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date('2021-11-02'))
        world = await setup()
        // process.env.chatDebug = 'true'
    })
    afterEach(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000
        await world.tearDown()
        jasmine.clock().uninstall()
        purgeGlobalCallbackRegistry()
    })

    it('Main scenario', async () => {
        // Chief arranges brainstorm
        const chiefBrainstormNoteUpd = await world.chief.chat()
        expect(chiefBrainstormNoteUpd.length).toBe(1)
        const brainstormButtons = getInlineKeyCallbacks(
            chiefBrainstormNoteUpd[0]
        )
        expect(brainstormButtons.length).toBe(1)
        const calendar = await world.chief.chatLast(brainstormButtons[0])

        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )

        const hour = getInlineKeyCallbacks(
            await world.chief.chatLast(dates[1], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await world.chief.chatLast(hour, true)
        )[2]
        const confirmUpd = await world.chief.chatLast(minutes, true)
        const confirmBtns = getInlineKeyCallbacks(confirmUpd)
        await world.chief.chat(confirmBtns[0])

        const tasks = await world.context.stores.taskStore.findSimple({})
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
        for (let u of world.users) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to the time of first reminder (5 mins)
        jasmine.clock().mockDate(new Date(tasks[1].time + 1000))
        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of world.users) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // Fast forward to brainstorm start time
        jasmine.clock().mockDate(new Date(tasks[2].time + 1000))

        // Check that in Novosibirsk is intended time
        expect(confirmUpd.message.text).toMatch('12:30 PM')
        expect(
            new Date().toLocaleString('en-US', {
                timeZone: world.city.timeZone,
            })
        ).toMatch(/12:30:\d\d PM/)

        await world.context.requestTaskQueue()
        // All members are notified
        for (let u of world.users) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
        const ideas: StoredBotUpdate[] = []
        // user 2 adds idea
        const idea1 = "Let's go FOO!!"
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
        for (let u of world.users) {
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
        for (let u of world.users) {
            if (u === world.user3) continue
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }

        // user 3, that suggested the most popular idea is to coordinate it with chief
        const coordinateUpd = await world.user3.chatLast()
        expect(coordinateUpd).toBeTruthy()
        const okay = getInlineKeyCallbacks(coordinateUpd)[0]
        const calendar2 = await world.user3.chatLast(okay)
        const dates2 = getInlineKeyCallbacks(calendar2).filter((cb) =>
            cb.includes('date')
        )
        const hour2 = getInlineKeyCallbacks(
            await world.user3.chatLast(dates2[2], true)
        )[4]
        const minutes2 = getInlineKeyCallbacks(
            await world.user3.chatLast(hour2, true)
        )[2]
        await world.user3.chat(minutes2, true)
        await world.user3.chatLast('Tarantulae Inn')
        await world.user3.chat('confirm-proposal', true)

        // check that quest negotiation works on coordination quests as well
        // new user receives proposal
        const chiefNotif = await world.chief.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(chiefNotif)
        const calendar3 = await world.chief.chatLast(userNotifButtons[1])
        const dates3 = getInlineKeyCallbacks(calendar3).filter((cb) =>
            cb.includes('date')
        )
        const hour3 = getInlineKeyCallbacks(
            await world.chief.chatLast(dates3[2]!, true)
        )[8]
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
        const spawnBtn = spawnButtons.find((b) => b.startsWith('spawn'))
        const ideaQuestHowWasItTask =
            await world.context.stores.taskStore._last()

        // spawn a new quest
        await world.chief.chat(spawnBtn!)
        await world.chief.chat('Buy FOO grenades!')
        const spawnedQuest = await world.context.stores.questStore._last()
        let spawnedOk: string | undefined
        let userToPropose: typeof world.user1 | undefined
        let userToAgree: typeof world.user1 | undefined
        for (let user of world.users) {
            if (spawnedQuest.memberIds.includes(user.member.id)) {
                if (!userToPropose) {
                    userToPropose = user
                    spawnedOk = getInlineKeyCallbacks(await user.chatLast())[0]
                } else {
                    userToAgree = user
                }
            }
        }
        if (!userToPropose || !userToAgree || !spawnedOk) {
            throw new Error('Aaaaa!!! Panic! no uses from quest!!!')
        }
        const calendar4 = await userToPropose.chatLast(spawnedOk)
        const dates4 = getInlineKeyCallbacks(calendar4).filter((cb) =>
            cb.includes('date')
        )
        const hour4 = getInlineKeyCallbacks(
            await userToPropose.chatLast(dates4[3], true)
        )[4]
        const minutes4 = getInlineKeyCallbacks(
            await userToPropose.chatLast(hour4, true)
        )[0]
        await userToPropose.chat(minutes4, true)
        await userToPropose.chatLast('Tarantulae Inn')
        await userToPropose.chat('confirm-proposal', true)
        // TODO note that here userToAccept still have button to start negotiation
        const spawnedProposeUpd = await userToAgree.chatLast()
        const spawnedProposeBtns = getInlineKeyCallbacks(spawnedProposeUpd)
        await userToAgree.chat(spawnedProposeBtns[0])
        const spawnManageBtns = getInlineKeyCallbacks(
            await userToPropose.chatLast()
        )
        const spawnHowWasItTask = await world.context.stores.taskStore._last()

        // Fast forward to feedback of original quest attenders
        jasmine.clock().mockDate(new Date(ideaQuestHowWasItTask!.time + 1000))
        await world.context.requestTaskQueue()

        const u3FeedbackUpd = await world.user3.chat()
        const u3FdbChButtons = getInlineKeyCallbacks(u3FeedbackUpd[0])
        expect(u3FdbChButtons.length).toBe(6)
        const rateChiefWisdomUpd = await world.user3.chatLast(
            u3FdbChButtons[5],
            true
        )
        const u3FdbWiBtns = getInlineKeyCallbacks(rateChiefWisdomUpd)
        await world.user3.chatLast(u3FdbWiBtns[3])

        // declare gathering
        const declareGathBtn = spawnManageBtns.find((b) =>
            b.startsWith('declare-gathering')
        )
        await userToPropose.chatLast(declareGathBtn)
        const calendarArr = await userToPropose.chatLast(
            "Let's go really Arr!!"
        )
        const arrDates = getInlineKeyCallbacks(calendarArr).filter((cb) =>
            cb.includes('date')
        )
        const arrHour = getInlineKeyCallbacks(
            await userToPropose.chatLast(arrDates[6], true)
        )[4]
        const arrMins = getInlineKeyCallbacks(
            await userToPropose.chatLast(arrHour, true)
        )[0]
        await userToPropose.chat(arrMins)
        const gConfirmUpd = await userToPropose.chatLast('GalaDirtily park')
        const gathReplyUpds = await userToPropose.chat(
            getInlineKeyCallbacks(gConfirmUpd)[0]
        )
        let proposeConfirm: string | undefined
        if (gathReplyUpds.length > 1) {
            proposeConfirm = getInlineKeyCallbacks(gathReplyUpds[1])[0]
        }
        const gatheringHowWasItTask =
            await world.context.stores.taskStore._last()

        // all other users got notified
        for (let user of world.users) {
            if (user === userToPropose && proposeConfirm) {
                await user.chat(proposeConfirm)
                continue
            }
            const upds = await user.chat()
            expect(upds.length).toBe(1)
            const btns = getInlineKeyCallbacks(upds[0])
            if (user === world.user3) {
                await user.chat(btns[1])
            } else {
                await user.chat(btns[0])
            }
        }

        // Fast forward to feedback of spawned task
        jasmine.clock().mockDate(new Date(spawnHowWasItTask!.time + 1000))
        await world.context.requestTaskQueue()
        const uToProposeFeedbackUpd = await userToPropose.chat()
        const uToProposeFdbChButtons = getInlineKeyCallbacks(
            uToProposeFeedbackUpd[0]
        )
        expect(uToProposeFdbChButtons.length).toBe(6)
        const uToProposeFdbWisdomUpd = await userToPropose.chatLast(
            uToProposeFdbChButtons[5],
            true
        )
        const uToProposeFdbWiBtns = getInlineKeyCallbacks(
            uToProposeFdbWisdomUpd
        )
        await userToPropose.chatLast(uToProposeFdbWiBtns[3])

        const uToAgreeFeedbackUpd = await userToAgree.chat()
        const uToAgreeFdbChButtons = getInlineKeyCallbacks(
            uToAgreeFeedbackUpd[0]
        )
        expect(uToAgreeFdbChButtons.length).toBe(6)
        const uToAgreeFdbWisdomUpd = await userToAgree.chatLast(
            uToAgreeFdbChButtons[5],
            true
        )
        const uToAgreeFdbWiBtns = getInlineKeyCallbacks(uToAgreeFdbWisdomUpd)
        await userToAgree.chatLast(uToAgreeFdbWiBtns[3])
    })
})
async function setup() {
    const context = await createContext()
    const { server, addTribeMember, makeClient, bot } =
        await createTelegramContext(context)

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Novosibirsk',
            timeZone: 'Asia/Novosibirsk',
        })
    )
    const tribe = await context.stores.tribeStore.save(
        new Tribe({
            cityId: city.id,
            name: 'Foo Tribe',
            description: 'We love to FOO!!!',
        })
    )

    const chief = await addTribeMember(
        makeClient('FooRiots', 'Tribe Chief'),
        tribe.id,
        city
    )
    const shaman = await addTribeMember(
        makeClient('Dart Food', 'Tribe Shaman'),
        tribe.id,
        city
    )
    const user1 = await addTribeMember(
        makeClient('Foyer 1', 'User 1'),
        tribe.id,
        city
    )
    const user2 = await addTribeMember(
        makeClient('Wooer 2', 'User 2'),
        tribe.id,
        city
    )
    const user3 = await addTribeMember(
        makeClient('Fore 3', 'User 3'),
        tribe.id,
        city
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
        users: [chief, shaman, user1, user2, user3],
        city,
        context,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
