import { purgeGlobalCallbackRegistry } from '../../plugins/ui/telegram/screens/callback-parser'
import { Awaited, noop, range } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { isIntroductionTask } from '../../use-cases/utils/scheduler'
import { createContext } from '../test-context'
import {
    createTelegramContext,
    getInlineKeyCallbacks,
    getKeyboardButtons,
} from './bot-utils'

const xdescribe = noop
xdescribe('Get into tribe [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
        jasmine.clock().install()
        jasmine.clock().mockDate(new Date('2021-11-02'))
        world = await setup()
        process.env.chatDebug = 'true'
    })
    afterEach(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000
        await world.tearDown()
        jasmine.clock().uninstall()
        process.env.chatDebug = ''
        purgeGlobalCallbackRegistry()
    })

    it('Main scenario', async () => {
        // /start
        const update = await world.newUser.chatLast('/start')
        const callbacks = getInlineKeyCallbacks(update)
        expect(callbacks).toEqual(['list-tribes', 'rules'])

        // list tribes
        await world.newUser.chat('list-tribes')
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        expect(tribesListUpdate.length).toBe(world.tribes.length + 1)
        expect(tribesListUpdate[0].message.text).toMatch(world.city.name)
        const markup = tribesListUpdate[0].message.reply_markup
        expect(markup && 'remove_keyboard' in markup).toBeTrue()

        // apply to last tribe
        const tribeListItem = tribesListUpdate[tribesListUpdate.length - 1]
        const applyButton = getInlineKeyCallbacks(tribeListItem)[1]
        expect(applyButton).toMatch('apply-tribe')
        const applyReply = await world.newUser.chatLast(applyButton)
        const tribeId = applyButton
            .replace('apply-tribe:', '')
            .replace(/:.*/, '')
        const tribe = world.tribes.find((t) => t.id === tribeId)
        expect(applyReply.message.text).toMatch(tribe!.name)
        const coverLetter = 'I want to FOO!!'
        await world.newUser.chat(coverLetter)

        // first old member is notified on new application
        const oldie1 = await world.getNextOldieClient()
        const oldieUpdates = await oldie1.chat()
        expect(oldieUpdates.length).toBe(1)
        const oldieNot = oldieUpdates[0]
        expect(oldieNot.message.text).toMatch(coverLetter)
        const oldieNotButtons = getInlineKeyCallbacks(oldieNot)

        expect(oldieNotButtons).toEqual([
            jasmine.stringMatching(`negotiate-quest`),
        ])

        // oldie proposes a meeting
        const calendar = await oldie1.chatLast(oldieNotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        const hour = getInlineKeyCallbacks(
            await oldie1.chatLast(dates[1], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await oldie1.chatLast(hour, true)
        )[2]
        await oldie1.chat(minutes, true)
        const proposalConfirmPrompt = await oldie1.chatLast(
            'Lets meet at Awesome Place Inn'
        )
        const proposalPromptButtons = getInlineKeyCallbacks(
            proposalConfirmPrompt
        )
        expect(proposalPromptButtons).toEqual([
            jasmine.stringMatching('confirm-proposal'),
            jasmine.stringMatching('negotiate-quest'),
        ])
        await oldie1.chat(proposalPromptButtons[0], true)

        // new user receives proposal
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        expect(userNotifButtons.length).toBe(2)
        const calendar2 = await world.newUser.chatLast(userNotifButtons[1])
        const dates2 = getInlineKeyCallbacks(calendar2).filter((cb) =>
            cb.includes('date')
        )
        const hour2 = getInlineKeyCallbacks(
            await world.newUser.chatLast(dates2[1], true)
        )[6]
        const minutes2 = getInlineKeyCallbacks(
            await world.newUser.chatLast(hour2, true)
        )[0]
        await world.newUser.chat(minutes2, true)
        const proposalConfirmPrompt2 = await world.newUser.chatLast(
            'Go Bar-Bar bar!'
        )
        const proposalPromptButtons2 = getInlineKeyCallbacks(
            proposalConfirmPrompt2
        )
        await world.newUser.chat(proposalPromptButtons2[0], true)

        // oldie receives candidate's new proposal
        const oldieUpdates2 = await oldie1.chat()
        expect(oldieUpdates.length).toBe(1)
        const usersProposalButtons = getInlineKeyCallbacks(oldieUpdates2[0])
        expect(usersProposalButtons.length).toBe(2)
        await oldie1.chat(usersProposalButtons[0])

        // candidate gets proposal confirmation
        const candidatesProposalConfirmedUpds = await world.newUser.chat()
        expect(candidatesProposalConfirmedUpds.length).toBe(1)

        // time forward to the point when system asks about initiation

        const feedbackTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(feedbackTask!.time + 1000))
        await world.context.requestTaskQueue()

        // oldie is asked if they accept member
        const oldie1FeedbackUpd = await oldie1.chat()
        expect(oldie1FeedbackUpd.length).toBe(1)
        const oldie1FeedbackButtons = getInlineKeyCallbacks(
            oldie1FeedbackUpd[0]
        )
        expect(oldie1FeedbackButtons).toEqual([
            jasmine.stringMatching('application-accept:'),
            jasmine.stringMatching('application-decline:'),
        ])
        const oldie1AcceptButton = oldie1FeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await oldie1.chat(oldie1AcceptButton)

        await checkNextOldie(3)
        await checkNextOldie(4)
        async function checkNextOldie(daysShift: number) {
            // next member receives application
            const oldie2 = await world.getNextOldieClient()
            expect(oldie1.member.id).not.toEqual(oldie2.member.id)

            const oldie2Updates = await oldie2.chat()
            expect(oldie2Updates.length).toBe(1)
            const oldie2Notice = oldie2Updates[0]
            expect(oldie2Notice.message.text).toMatch(coverLetter)
            const oldie2NotButtons = getInlineKeyCallbacks(oldie2Notice)
            // oldie2 proposes a meeting
            const shCalendar = await oldie2.chatLast(oldie2NotButtons[0])
            const shDates = getInlineKeyCallbacks(shCalendar).filter((cb) =>
                cb.includes('date')
            )
            const shHour = getInlineKeyCallbacks(
                await oldie2.chatLast(shDates[daysShift], true)
            )[4]
            const shMinutes = getInlineKeyCallbacks(
                await oldie2.chatLast(shHour, true)
            )[2]
            await oldie2.chat(shMinutes, true)
            const shProposalConfirmPrompt = await oldie2.chatLast('Ku-Ku Ha')
            const shProposalPromptButtons = getInlineKeyCallbacks(
                shProposalConfirmPrompt
            )
            await oldie2.chat(shProposalPromptButtons[0], true)

            // user gets oldie2's proposal
            const oldie2sProposalUpd = await world.newUser.chat()
            expect(oldie2sProposalUpd.length).toBe(1)
            const oldie2sProposalButtons = getInlineKeyCallbacks(
                oldie2sProposalUpd[0]
            )
            await world.newUser.chat(oldie2sProposalButtons[0])
            // oldie2 receives note that quest accepted
            const shUserAgreedUpd = await oldie2.chat()
            expect(shUserAgreedUpd.length).toBe(1)

            // time forward to the point when system asks about initiation

            const feedbackTask2 = await world.context.stores.taskStore._last()
            jasmine.clock().mockDate(new Date(feedbackTask2!.time + 1000))
            await world.context.requestTaskQueue()

            // oldie2 is asked if they accept member
            const oldie2FeedbackUpd = await oldie2.chat()
            expect(oldie2FeedbackUpd.length).toBe(1)
            const oldie2FeedbackButtons = getInlineKeyCallbacks(
                oldie2FeedbackUpd[0]
            )
            expect(oldie2FeedbackButtons).toEqual([
                jasmine.stringMatching('application-accept:'),
                jasmine.stringMatching('application-decline:'),
            ])
            const oldie2AcceptButton = oldie2FeedbackButtons.find((b) =>
                b.startsWith('application-accept:')
            )!
            await oldie2.chat(oldie2AcceptButton)
        }

        // new user is notified on their approval
        const acceptedUpdate = await world.newUser.chat()
        expect(acceptedUpdate.length).toBe(1)

        const introOldie = await world.getNextIntroClient()
        // time forward to the point when intro task was allocated
        const introTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(introTask!.time + 1000))
        await world.context.requestTaskQueue()

        // the old user receives invitation to make an intro quest
        const oldieUpds = await introOldie.chat()
        expect(oldieUpds.length).toBe(1)

        const oldieOk = getInlineKeyCallbacks(oldieUpds[0])[0]
        const oldieCalendar = await introOldie.chatLast(oldieOk)
        const olDates = getInlineKeyCallbacks(oldieCalendar).filter((cb) =>
            cb.includes('date')
        )
        const olHour = getInlineKeyCallbacks(
            await introOldie.chatLast(olDates[6]!, true)
        )[6]
        const olMinutes = getInlineKeyCallbacks(
            await introOldie.chatLast(olHour, true)
        )[0]
        await introOldie.chat(olMinutes, true)
        const olConfirm = getInlineKeyCallbacks(
            await introOldie.chatLast('Go Bla-blaKar bar!')
        )
        await introOldie.chat(olConfirm[0], true)

        // new member receives invitation on intro quest
        const introUpd = await world.newUser.chat()
        expect(introUpd.length).toBe(1)
        const introAgree = getInlineKeyCallbacks(introUpd[0])[0]
        await world.newUser.chat(introAgree)

        // oldie notified that newbie agreed
        expect((await introOldie.chat()).length).toBe(1)

        // now oldie 2 is notified on intro quest

        // time forward to the point when intro task was allocated
        const introOldie2 = await world.getNextIntroClient()
        const intro2Task = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(intro2Task!.time + 1000))
        await world.context.requestTaskQueue()

        expect(introOldie2.member.id).not.toEqual(introOldie.member.id)
        const oldieUpds2 = await introOldie2.chat()
        expect(oldieUpds2.length).toBe(1)
    })

    it('Shows tribes list on location sharing', async () => {
        await world.newUser.chatLast('/start')
        const response = await world.newUser.chatLast('list-tribes')
        // should have button for sharing location
        const btn = getKeyboardButtons(response)[0]

        expect(btn).toBeTruthy()
        expect(typeof btn === 'object' && 'request_location' in btn).toBeTrue()
        await world.newUser.client.sendMessage(
            world.newUser.client.makeMessage('', {
                location: {
                    latitude: 55,
                    longitude: 83,
                },
            })
        )
        const tribesListUpdate = await world.newUser.chat()
        expect(tribesListUpdate.length).toBe(world.tribes.length + 1)
    })

    it('Decline application', async () => {
        await world.newUser.chat('/start')
        await world.newUser.chat('list-tribes')
        const lastTribeReply = await world.newUser.chatLast(world.city.name)
        await world.newUser.chat(getInlineKeyCallbacks(lastTribeReply)[1])
        await world.newUser.chat('I want to FOO!!')
        const oldie1 = await world.getNextOldieClient()
        const oldie1Updates = await oldie1.chat()
        const oldie1Notice = oldie1Updates[0]
        const oldie1NotButtons = getInlineKeyCallbacks(oldie1Notice)
        // oldie1 proposes a meeting
        const shCalendar = await oldie1.chatLast(oldie1NotButtons[0])
        const shDates = getInlineKeyCallbacks(shCalendar).filter((cb) =>
            cb.includes('date')
        )
        const shHour = getInlineKeyCallbacks(
            await oldie1.chatLast(shDates[3], true)
        )[4]
        const shMinutes = getInlineKeyCallbacks(
            await oldie1.chatLast(shHour, true)
        )[2]
        await oldie1.chat(shMinutes, true)
        const shProposalConfirmPrompt = await oldie1.chatLast('Ku-Ku Ha')
        const shProposalPromptButtons = getInlineKeyCallbacks(
            shProposalConfirmPrompt
        )
        await oldie1.chat(shProposalPromptButtons[0], true)

        // user gets oldie1's proposal
        const oldie1sProposalUpd = await world.newUser.chat()
        expect(oldie1sProposalUpd.length).toBe(1)
        const oldie1sProposalButtons = getInlineKeyCallbacks(
            oldie1sProposalUpd[0]
        )
        await world.newUser.chat(oldie1sProposalButtons[0])
        // oldie1 receives note that quest accepted
        const shUserAgreedUpd = await oldie1.chat()
        expect(shUserAgreedUpd.length).toBe(1)

        // time forward to the point when system asks about initiation

        const feedbackTask2 = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(feedbackTask2!.time + 1000))
        await world.context.requestTaskQueue()

        // oldie1 is asked if they accept member
        const oldie1FeedbackUpd = await oldie1.chat()
        expect(oldie1FeedbackUpd.length).toBe(1)
        const oldie1FeedbackButtons = getInlineKeyCallbacks(
            oldie1FeedbackUpd[0]
        )
        expect(oldie1FeedbackButtons).toEqual([
            jasmine.stringMatching('application-accept:'),
            jasmine.stringMatching('application-decline:'),
        ])
        const oldie1DeclineButton = oldie1FeedbackButtons.find((b) =>
            b.startsWith('application-decline:')
        )!
        await oldie1.chat(oldie1DeclineButton)
        const updates = await world.newUser.chat()
        expect(updates.length).toBe(1)
    })

    it('Shows errors (wrong member)', async () => {
        await world.newUser.chatLast('/start')
        await world.newUser.chat('list-tribes')
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        const tribeListItem = tribesListUpdate[tribesListUpdate.length - 1]
        const applyButton = getInlineKeyCallbacks(tribeListItem)[1]
        await world.newUser.chatLast(applyButton)
        await world.newUser.chat('I want to FOO!!')

        const oldie1 = await world.getNextOldieClient()
        const oldie1Updates = await oldie1.chat()
        const oldie1Note = oldie1Updates[0]
        const oldie1NotButtons = getInlineKeyCallbacks(oldie1Note)

        // oldie1 set's date
        const calendar = await oldie1.chatLast(oldie1NotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        const hour = getInlineKeyCallbacks(
            await oldie1.chatLast(dates[3], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await oldie1.chatLast(hour, true)
        )[2]
        await oldie1.chat(minutes, true)
        const proposalConfirmPrompt = await oldie1.chatLast(
            'Lets meet at Awesome Place Inn'
        )
        const proposalPromptButtons = getInlineKeyCallbacks(
            proposalConfirmPrompt
        )
        await oldie1.chat(proposalPromptButtons[0], true)

        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        const agreeBtn = userNotifButtons.find((b) => b.startsWith('agree'))
        await world.newUser.chatLast(agreeBtn)

        // oldie1 notified on confirmation
        await oldie1.chat()
        // time forward to the point when system asks about initiation
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.context.requestTaskQueue()

        // oldie1 accepts member
        const oldie1FeedbackUpd = await oldie1.chat()
        const oldie1FeedbackButtons = getInlineKeyCallbacks(
            oldie1FeedbackUpd[0]
        )
        const oldie1AcceptButton = oldie1FeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await oldie1.chat(oldie1AcceptButton)
        // Now oldie1 changes their mind, but application already handed over to next oldie
        const oldie1DeclineButton = oldie1FeedbackButtons.find((b) =>
            b.startsWith('application-decline')
        )!

        // TODO check that error is shown maybe? 🤔
        await oldie1.forceCallback(oldie1DeclineButton)
    })
    it('Accepts member without shaman initiation, if tribe has no shaman', async () => {
        await world.newUser.chatLast('/start')
        await world.newUser.chat('list-tribes')
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        // The first tribe has only one member
        const tribeListItem = tribesListUpdate[1]

        const applyButton = getInlineKeyCallbacks(tribeListItem)[1]
        await world.newUser.forceCallback(applyButton)
        await world.newUser.chat('I want to FOO!!')

        const oldie1 = await world.getNextOldieClient()
        const oldie1Updates = await oldie1.chat()
        const oldie1Note = oldie1Updates[0]
        const oldie1NotButtons = getInlineKeyCallbacks(oldie1Note)

        // oldie1 set's date
        const calendar = await oldie1.chatLast(oldie1NotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        const hour = getInlineKeyCallbacks(
            await oldie1.chatLast(dates[3], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await oldie1.chatLast(hour, true)
        )[2]
        await oldie1.chat(minutes, true)
        const proposalConfirmPrompt = await oldie1.chatLast(
            'Lets meet at Awesome Place Inn'
        )
        const proposalPromptButtons = getInlineKeyCallbacks(
            proposalConfirmPrompt
        )
        await oldie1.chat(proposalPromptButtons[0], true)

        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        await world.newUser.chatLast(userNotifButtons[0])

        // oldie1 notified on confirmation
        await oldie1.chat()
        // time forward to the point when system asks about initiation
        const feedbackTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(feedbackTask!.time + 1000))
        await world.context.requestTaskQueue()

        // oldie1 accepts member
        const oldie1FeedbackUpd = await oldie1.chat()
        const oldie1FeedbackButtons = getInlineKeyCallbacks(
            oldie1FeedbackUpd[0]
        )
        const oldie1AcceptButton = oldie1FeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await oldie1.chat(oldie1AcceptButton, true)

        // new user is notified on their acceptance
        const upd = await world.newUser.chat()
        expect(upd.length).toBe(1)
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
            geometry: {
                type: 'MultiPolygon',
                coordinates: [
                    [
                        [
                            [82.7, 55.1],
                            [83.2, 55.1],
                            [83.2, 54.7],
                            [82.7, 54.7],
                            [82.7, 55.1],
                        ],
                    ],
                ],
            },
        })
    )
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Foo Tribe',
            description: 'We love to FOO!!!',
        }),
        new Tribe({
            cityId: city.id,
            name: 'Bar Tribe',
            description: 'We BAR BAR!',
        }),
    ])

    const oldies: Array<Awaited<ReturnType<typeof addTribeMember>>> = []
    for (let i = 1; i < 6; i++) {
        oldies.push(
            await addTribeMember(
                makeClient(`Oldie-${i}`, `Old member ${i}`),
                tribes[1].id,
                city
            )
        )
    }
    oldies.push(
        await addTribeMember(
            makeClient(`Oldie-tribe-0`, `Lonely`),
            tribes[0].id,
            city
        )
    )

    const newUser = makeClient('Newbie', 'Applicant')

    function getOldieById(id: string) {
        const oldie = oldies.find((o) => o.member.id === id)
        if (!oldie) {
            throw new Error(
                `Cannot find oldie ${id} in ${oldies.map((o) => o.member.id)}`
            )
        }

        return oldie
    }
    return {
        async getNextOldieClient() {
            const application = await context.stores.applicationStore._last()
            const memberId = application.currentElderId
            return getOldieById(memberId)
        },
        async getNextIntroClient() {
            const tasks = await context.stores.taskStore.findSimple({
                type: 'introduction-quest',
                done: false,
            })
            if (!tasks.length || !isIntroductionTask(tasks[0])) {
                throw new Error('Cannot find next intro task')
            }
            return getOldieById(tasks[0].payload.oldMemberId)
        },
        oldies,
        newUser,
        city,
        tribes,
        context,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
