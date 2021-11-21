import TelegramServer from 'telegram-test-api'
import { createContext } from '../test-context'
import { makeBot } from '../../plugins/ui/telegram/bot'
import { StoreTelegramUsersAdapter } from '../../plugins/ui/telegram/users-adapter'
import {
    getInlineKeyCallbacks,
    getKeyboardButtons,
    wrapClient,
} from './bot-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { Awaited } from '../../ts-utils'
import { Member } from '../../use-cases/entities/member'
import { TaskDiscpatcher } from '../../use-cases/utils/task-dispatcher'
import { Scheduler } from '../../use-cases/utils/scheduler'

function xdescribe(...args: any[]) {}
describe('Get into tribe [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        world = await setup()
    })
    afterEach(async () => {
        await world.tearDown()
    })

    fit('apply to tribe, initiate new member, introduce to tribe', async () => {
        // /start
        const update = await world.newUser.chatLast('/start')
        const callbacks = getInlineKeyCallbacks(update)
        expect(callbacks).toEqual(['list-tribes', 'rules'])

        // list tribes
        await world.newUser.chat('list-tribes')
        // TODO check it asks for location
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        expect(tribesListUpdate.length).toBe(world.tribes.length + 1)
        expect(tribesListUpdate[0].message.text).toMatch(world.city.name)
        const markup = tribesListUpdate[0].message.reply_markup
        expect(markup && 'remove_keyboard' in markup).toBeTrue()

        // apply to last tribe
        const tribeListItem = tribesListUpdate[tribesListUpdate.length - 1]
        const applyButton = getInlineKeyCallbacks(tribeListItem)[0]
        expect(applyButton).toMatch('apply-tribe')
        const applyReply = await world.newUser.chatLast(applyButton)
        const tribeId = applyButton.replace('apply-tribe:', '')
        const tribe = world.tribes.find((t) => t.id === tribeId)
        expect(applyReply.message.text).toMatch(tribe!.name)
        // TODO check that it asks for cover letter
        const coverLetter = 'I want to FOO!!'
        await world.newUser.chat(coverLetter)
        // Chief is notified on new application
        const chiefUpdates = await world.chief.chat()
        expect(chiefUpdates.length).toBe(1)
        const chiefNot = chiefUpdates[0]
        expect(chiefNot.message.text).toMatch(coverLetter)
        const newUserMember = (await world.context.stores.memberStore._last())!
        const initQuest = await world.context.stores.questStore._last()
        const chiefNotButtons = getInlineKeyCallbacks(chiefNot)
        expect(chiefNotButtons).toEqual([
            jasmine.stringMatching(`propose-initiation`),
            jasmine.stringMatching(`decline-application`),
        ])

        // Chief proposes a meeting
        const propose = chiefNotButtons.find((b) => b.startsWith('propose'))
        const calendar = await world.chief.chatLast(propose!)
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        // NOTE this test will fail at the end of the month...
        const hour = getInlineKeyCallbacks(
            await world.chief.chatLast(dates[3], true)
        )[4]
        const minutes = getInlineKeyCallbacks(
            await world.chief.chatLast(hour, true)
        )[2]
        await world.chief.chat(minutes, true)
        const proposalConfirmPrompt = await world.chief.chatLast(
            'Lets meet at Awesome Place Inn'
        )
        const proposalPromptButtons = getInlineKeyCallbacks(
            proposalConfirmPrompt
        )
        expect(proposalPromptButtons).toEqual([
            'confirm-proposal',
            'redo-proposal',
        ])
        await world.chief.chat('confirm-proposal', true)

        // new user recieves proposal
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        expect(userNotifButtons).toEqual([
            `agree-quest:${newUserMember.id}:${initQuest?.id}`,
            `change-quest:${newUserMember.id}:${initQuest?.id}`,
        ])
        const propose2 = userNotifButtons.find((b) => b.startsWith('change'))
        const calendar2 = await world.newUser.chatLast(propose2!)
        const dates2 = getInlineKeyCallbacks(calendar2).filter((cb) =>
            cb.includes('date')
        )
        const hour2 = getInlineKeyCallbacks(
            await world.newUser.chatLast(dates2[6]!, true)
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
        expect(proposalPromptButtons2).toEqual([
            'confirm-proposal',
            'redo-proposal',
        ])
        await world.newUser.chat('confirm-proposal', true)

        // chief recieves candidate's new proposal
        const chiefUpdates2 = await world.chief.chat()
        expect(chiefUpdates.length).toBe(1)
        const usersProposalButtons = getInlineKeyCallbacks(chiefUpdates2[0])
        expect(usersProposalButtons).toEqual([
            `agree-quest:${world.chief.member.id}:${initQuest?.id}`,
            `change-quest:${world.chief.member.id}:${initQuest?.id}`,
        ])
        const agreeButton = usersProposalButtons.find((b) =>
            b.startsWith('agree')
        )!
        await world.chief.chat(agreeButton)

        // candidate gets proposal confirmation
        const candidatesProposalConfiremdUpds = await world.newUser.chat()
        expect(candidatesProposalConfiremdUpds.length).toBe(1)

        // time forward to the point when system asks about initiation

        jasmine.clock().install()
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        world.requestTaskQueue()
        jasmine.clock().uninstall()

        // chief is asked if they accept member
        const chiefFeedbackUpd = await world.chief.chat()
        expect(chiefFeedbackUpd.length).toBe(1)
        const chiefFeedbackButtons = getInlineKeyCallbacks(chiefFeedbackUpd[0])
        expect(chiefFeedbackButtons).toEqual([
            jasmine.stringMatching('application-accept:'),
            jasmine.stringMatching('application-decline:'),
        ])
        const chiefAcceptButton = chiefFeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await world.chief.chat(chiefAcceptButton, true)

        // new user is asked to rate chief's charisma & wisdom
        const nuChiefRateUpd = await world.newUser.chat()
        expect(nuChiefRateUpd.length).toBe(1)
        const rateChiefCharismaButtons = getInlineKeyCallbacks(
            nuChiefRateUpd[0]
        )
        expect(rateChiefCharismaButtons.length).toBe(6)
        const rateChiefWisdomUpd = await world.newUser.chatLast(
            rateChiefCharismaButtons[5],
            true
        )
        const rateChiefWisdomButtons = getInlineKeyCallbacks(rateChiefWisdomUpd)
        expect(rateChiefWisdomButtons.length).toBe(6)
        await world.newUser.chatLast(rateChiefWisdomButtons[3])
        const cMember = await world.context.stores.memberStore.getById(
            world.chief.member.id
        )
        expect(cMember?.votes.length).toBe(1)

        // shaman recieves application
        const shamanUpdates = await world.shaman.chat()
        expect(shamanUpdates.length).toBe(1)
        const shamanNotice = shamanUpdates[0]
        expect(shamanNotice.message.text).toMatch(coverLetter)
        const initQuest2 = await world.context.stores.questStore._last()
        const shamanNotButtons = getInlineKeyCallbacks(shamanNotice)
        expect(shamanNotButtons).toEqual([
            jasmine.stringMatching(`propose-initiation`),
            jasmine.stringMatching(`decline-application`),
        ])

        // shaman proposes a meeting
        const shPropose = shamanNotButtons.find((b) => b.startsWith('propose'))
        const shCalendar = await world.shaman.chatLast(shPropose!)
        const shDates = getInlineKeyCallbacks(shCalendar).filter((cb) =>
            cb.includes('date')
        )
        const shHour = getInlineKeyCallbacks(
            await world.shaman.chatLast(shDates[3], true)
        )[4]
        const shMinutes = getInlineKeyCallbacks(
            await world.shaman.chatLast(shHour, true)
        )[2]
        await world.shaman.chat(shMinutes, true)
        const shProposalConfirmPrompt = await world.shaman.chatLast('Ku-Ku Ha')
        const shProposalPromptButtons = getInlineKeyCallbacks(
            shProposalConfirmPrompt
        )
        expect(shProposalPromptButtons).toEqual([
            'confirm-proposal',
            'redo-proposal',
        ])
        await world.shaman.chat('confirm-proposal', true)

        // user gets shaman's proposal
        const shamansProposalUpd = await world.newUser.chat()
        expect(shamansProposalUpd.length).toBe(1)
        const shamansProposalButtons = getInlineKeyCallbacks(
            shamansProposalUpd[0]
        )
        expect(shamansProposalButtons).toEqual([
            jasmine.stringMatching(`agree-quest`),
            jasmine.stringMatching(`change-quest`),
        ])
        await world.newUser.chat(shamansProposalButtons[0])
        // shaman recieves note that quest accepted
        const shUserAgreedUpd = await world.shaman.chat()
        expect(shUserAgreedUpd.length).toBe(1)

        // time forward to the point when system asks about initiation

        jasmine.clock().install()
        const howWasInitTask2 = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask2!.time + 1000))
        world.requestTaskQueue()
        jasmine.clock().uninstall()

        // new user is asked to rate shaman's charisma & wisdom
        const nuShamanRateUpd = await world.newUser.chat()
        expect(nuShamanRateUpd.length).toBe(1)
        const rateShamanCharismaButtons = getInlineKeyCallbacks(
            nuShamanRateUpd[0]
        )
        expect(rateShamanCharismaButtons.length).toBe(6)
        const rateShamanWisdomUpd = await world.newUser.chatLast(
            rateShamanCharismaButtons[5],
            true
        )
        const rateShamanWisdomButtons =
            getInlineKeyCallbacks(rateShamanWisdomUpd)
        expect(rateShamanWisdomButtons.length).toBe(6)
        await world.newUser.chatLast(rateShamanWisdomButtons[3])
        const shMember = await world.context.stores.memberStore.getById(
            world.shaman.member.id
        )
        expect(shMember?.votes.length).toBe(1)

        // shaman is asked if they accept member
        const shamanFeedbackUpd = await world.shaman.chat()
        expect(shamanFeedbackUpd.length).toBe(1)
        const shamanFeedbackButtons = getInlineKeyCallbacks(
            shamanFeedbackUpd[0]
        )
        expect(shamanFeedbackButtons).toEqual([
            jasmine.stringMatching('application-accept:'),
            jasmine.stringMatching('application-decline:'),
        ])
        const shamanAcceptButton = shamanFeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await world.shaman.chat(shamanAcceptButton, true)
        process.env.chatDebug = 'true'

        // new user is notified on thier approval
        const acceptedUpdate = await world.newUser.chat()
        expect(acceptedUpdate.length).toBe(1)
    })

    it('Shows tribes list on location sharing', async () => {
        await world.newUser.chatLast('/start')
        const response = await world.newUser.chatLast('list-tribes')
        // should have button for sharing location
        const btn = getKeyboardButtons(response)[0]
        expect(btn).toBeTruthy()
        expect(typeof btn === 'object' && 'request_location' in btn).toBeTrue()
        // TODO add location to test API client
    })
    it('Decline application', async () => {
        await world.newUser.chat('/start')
        await world.newUser.chat('list-tribes')
        const lastTribeReply = await world.newUser.chatLast(world.city.name)
        await world.newUser.chat(getInlineKeyCallbacks(lastTribeReply)[0])

        await world.newUser.chat('I want to FOO!!')
        const chiefUpdates = await world.chief.chatLast()
        const buttons = getInlineKeyCallbacks(chiefUpdates)
        const decline = buttons.find((b) => b.startsWith('decline'))
        await world.chief.chat(decline!)
        await world.chief.chat('Because fuck off!')
        const updates = await world.newUser.client.getUpdates()
        expect(updates.result.length).toBe(1)
    })
})

async function setup() {
    // process.env.chatDebug = 'true'
    const token = '-test-bot-token'
    const server = new TelegramServer({ port: 9001 })
    await server.start()

    const context = await createContext()

    const bot = await makeBot({
        notifcationsBus: context.async.notififcationBus,
        token,
        tribalism: context.tribalism,
        webHook: {
            port: 9002,
            path: '/tg-hook',
        },
        telegramUsersAdapter: new StoreTelegramUsersAdapter(
            context.stores.userStore
        ),
        telegramURL: server.config.apiURL,
    })
    const scheduler = new Scheduler(context.stores.taskStore)
    const taskDiscpatcher = new TaskDiscpatcher(context.tribalism, scheduler)

    const newUser = wrapClient(
        server,
        server.getClient(token, {
            firstName: 'Newbie',
            userName: 'Applicant',
            chatId: 3,
            userId: 3,
        })
    )
    const chief = wrapClient(
        server,
        server.getClient(token, {
            firstName: 'BarBar Monster',
            userName: 'Tribe Chief',
            chatId: 1,
            userId: 1,
        })
    )
    const shaman = wrapClient(
        server,
        server.getClient(token, {
            firstName: 'Barlog',
            userName: 'Tribe Shaman',
            chatId: 2,
            userId: 2,
        })
    )
    await chief.chat('/start')
    const chiefUser = await context.stores.userStore._last()
    await shaman.chat('/start')
    const shamanUser = await context.stores.userStore._last()

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Novosibirsk',
        })
    )
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Foo Tribe',
            description: 'We love to FOOO!!!',
        }),
        new Tribe({
            cityId: city.id,
            name: 'Bar Tribe',
            description: 'We BAR BAR!',
        }),
    ])
    const chiefMember = await context.stores.memberStore.save(
        new Member({
            tribeId: tribes[1].id,
            userId: chiefUser!.id,
            isCandidate: false,
            charisma: 10,
            wisdom: 5,
        })
    )
    const shamanMember = await context.stores.memberStore.save(
        new Member({
            tribeId: tribes[1].id,
            userId: shamanUser!.id,
            isCandidate: false,
            charisma: 5,
            wisdom: 10,
        })
    )
    await context.stores.tribeStore.save({
        ...tribes[1],
        chiefId: chiefMember.id,
        shamanId: shamanMember.id,
    })

    return {
        bot,
        requestTaskQueue: async () => {
            if (process.env.chatDebug) {
                console.log(
                    `--- tasks updates requested, now is ${new Date()} ---`
                )
            }
            await taskDiscpatcher.run()
        },
        chief: {
            ...chief,
            member: chiefMember,
            user: chiefUser,
        },
        shaman: {
            ...shaman,
            member: shamanMember,
            user: shamanUser,
        },
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
