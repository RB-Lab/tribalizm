import { StoredBotUpdate } from 'telegram-test-api/lib/telegramServer'
import { purgeGlobalCallbackRegistry } from '../../plugins/ui/telegram/screens/callback-parser'
import { Awaited } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import { createTelegramContext, getInlineKeyCallbacks } from './bot-utils'

describe('Brainstorm [integration]', () => {
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
        // Admin arranges a brainstorm

        await world.callAdminApi('declareBrainstorm', {
            time: '2021-11-5 12:30',
            tribeId: world.tribe.id,
        })
        const tasks = await world.context.stores.taskStore.findSimple({})

        // All members are notified
        for (let u of world.users) {
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
        await world.users[2].client.sendMessage(
            world.users[2].client.makeMessage(idea1)
        )
        // All members are notified
        for (let u of world.users) {
            if (u === world.users[2]) continue
            const upds = await u.chat()
            expect(upds.length).toBe(1)
            expect(upds[0].message.text).toMatch(idea1)
            ideas.push(upds[0])
        }
        // user 3 adds idea
        const idea2 = "Let's go Arr!!"
        await world.users[3].client.sendMessage(
            world.users[3].client.makeMessage(idea2)
        )
        // All members are notified
        for (let u of world.users) {
            if (u === world.users[3]) continue
            const upds = await u.chat()
            expect(upds.length).toBe(1)
            expect(upds[0].message.text).toMatch(idea2)
            ideas.push(upds[0])
        }

        // Fast forward to the voting phase of the storm
        const overTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(overTask!.time + 1000))
        await world.context.requestTaskQueue()
        // all users notified that it is time to vote
        for (let u of world.users) {
            const upds = await u.chat()
            expect(upds.length).toBe(1)
        }
        // check that messages with ideas have buttons now
        const updIds = ideas.map((i) => i.updateId)
        const updHst = await world.users[1].client.getUpdatesHistory()
        // filter ideas out of all updates that bot have in history
        const ideasMessages = updHst.filter((u) =>
            updIds.includes(u.updateId)
        ) as StoredBotUpdate[]
        for (let upd of ideasMessages) {
            expect(getInlineKeyCallbacks(upd as any).length).toBe(2)
        }

        // everybody votes for second idea
        for (let user of world.users) {
            for (let message of ideasMessages) {
                const messageBelongsToCurrentUser =
                    String(message.message.chat_id) ===
                    String((user.client as any).chatId)
                const messageWithIdea2 = new RegExp(idea2).test(
                    message.message.text
                )
                if (messageBelongsToCurrentUser && messageWithIdea2) {
                    const btnUp = getInlineKeyCallbacks(message)[0]
                    await user.forceCallback(btnUp, true)
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

        let okay = ''
        for (let u of world.users) {
            const upds = await u.chat()
            if (u === world.users[3]) {
                // idea author is notified that they are going to coordinate execution
                expect(upds.length).toBe(2)
                okay = getInlineKeyCallbacks(upds[1])[0]
            } else {
                expect(upds.length).toBe(1)
            }
        }

        // user 3, that suggested the most popular idea is to coordinate it with chief
        const calendar2 = await world.users[3].chatLast(okay)

        const dates2 = getInlineKeyCallbacks(calendar2).filter((cb) =>
            cb.includes('date')
        )
        const hour2 = getInlineKeyCallbacks(
            await world.users[3].chatLast(dates2[2], true)
        )[4]
        const minutes2 = getInlineKeyCallbacks(
            await world.users[3].chatLast(hour2, true)
        )[2]
        await world.users[3].chat(minutes2, true)
        await world.users[3].chatLast('Tarantulae Inn')
        await world.users[3].chat('confirm-proposal', true)

        // check that quest negotiation works on coordination quests as well
        // new user receives proposal
        const cQuest1 = await world.context.stores.questStore._last()
        const memberId = cQuest1.memberIds.find(
            (id) => id !== world.users[3].member.id
        )!
        const otherMember = world.users.find((u) => u.member.id === memberId)!

        const otherNotif = await otherMember.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(otherNotif)
        const calendar3 = await otherMember.chatLast(userNotifButtons[1])
        const dates3 = getInlineKeyCallbacks(calendar3).filter((cb) =>
            cb.includes('date')
        )
        const hour3 = getInlineKeyCallbacks(
            await otherMember.chatLast(dates3[2]!, true)
        )[8]
        const minutes3 = getInlineKeyCallbacks(
            await otherMember.chatLast(hour3, true)
        )[0]
        await otherMember.chat(minutes3, true)
        await otherMember.chatLast('Go Bar-Bar bar!')
        await otherMember.chat('confirm-proposal', true)
        const reProposeUpd = await world.users[3].chat()
        const reProposedButtons = getInlineKeyCallbacks(reProposeUpd[0])
        await world.users[3].chat(reProposedButtons[0])

        // get "agreed on quest + buttons"
        const otherConfirmUpd = await otherMember.chat()
        expect(otherConfirmUpd.length).toBe(2)
        const spawnButtons = getInlineKeyCallbacks(otherConfirmUpd[1])
        expect(spawnButtons).toEqual([
            jasmine.stringMatching('spawn-quest'),
            jasmine.stringMatching('re-quest'),
            jasmine.stringMatching('declare-gathering'),
            jasmine.stringMatching('declare-gathering'),
        ])

        // // spawn a new quest
        const spawnBtn = spawnButtons.find((b) => b.startsWith('spawn'))
        await otherMember.chat(spawnBtn!)
        await otherMember.chat('Buy FOO grenades!')
        const spawnedQuest = await world.context.stores.questStore._last()
        let spawnedOk: string | undefined
        let userToPropose: typeof world.users[0] | undefined
        let userToAgree: typeof world.users[0] | undefined
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

        // all other users got notified
        for (let user of world.users) {
            if (user === userToPropose && proposeConfirm) {
                await user.chat(proposeConfirm)
                continue
            }
            const upds = await user.chat()
            expect(upds.length).toBe(1)
            const btns = getInlineKeyCallbacks(upds[0])
            await user.chat(btns[0])
        }
    })
})
async function setup() {
    const context = await createContext()
    const { server, addTribeMember, makeClient, bot, callAdminApi } =
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

    type Client = Awaited<ReturnType<typeof addTribeMember>>
    const users: Client[] = []
    for (let i = 0; i < 5; i++) {
        users.push(
            await addTribeMember(
                makeClient(`User-${i}`, `User-${i}`),
                tribe.id,
                city
            )
        )
    }

    return {
        callAdminApi,
        tribe,
        users,
        city,
        context,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
