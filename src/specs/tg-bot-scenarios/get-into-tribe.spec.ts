import { Awaited } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { createContext } from '../test-context'
import {
    createTelegramContext,
    getInlineKeyCallbacks,
    getKeyboardButtons,
} from './bot-utils'

describe('Get into tribe [integration]', () => {
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
        const applyButton = getInlineKeyCallbacks(tribeListItem)[0]
        expect(applyButton).toMatch('apply-tribe')
        const applyReply = await world.newUser.chatLast(applyButton)
        const tribeId = applyButton.replace('apply-tribe:', '')
        const tribe = world.tribes.find((t) => t.id === tribeId)
        expect(applyReply.message.text).toMatch(tribe!.name)
        const coverLetter = 'I want to FOO!!'
        await world.newUser.chat(coverLetter)
        // Chief is notified on new application
        const chiefUpdates = await world.chief.chat()
        expect(chiefUpdates.length).toBe(1)
        const chiefNot = chiefUpdates[0]
        expect(chiefNot.message.text).toMatch(coverLetter)
        const newUserMember = await world.context.stores.memberStore._last()
        const initQuest = await world.context.stores.questStore._last()
        const chiefNotButtons = getInlineKeyCallbacks(chiefNot)

        expect(chiefNotButtons).toEqual([
            jasmine.stringMatching(`negotiate-quest`),
            jasmine.stringMatching(`decline-application`),
        ])

        // Chief proposes a meeting
        const calendar = await world.chief.chatLast(chiefNotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
        const hour = getInlineKeyCallbacks(
            await world.chief.chatLast(dates[1], true)
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
            jasmine.stringMatching('confirm-proposal'),
            jasmine.stringMatching('negotiate-quest'),
        ])
        await world.chief.chat(proposalPromptButtons[0], true)

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

        // chief receives candidate's new proposal
        const chiefUpdates2 = await world.chief.chat()
        expect(chiefUpdates.length).toBe(1)
        const usersProposalButtons = getInlineKeyCallbacks(chiefUpdates2[0])
        expect(usersProposalButtons.length).toBe(2)
        await world.chief.chat(usersProposalButtons[0])

        // candidate gets proposal confirmation
        const candidatesProposalConfirmedUpds = await world.newUser.chat()
        expect(candidatesProposalConfirmedUpds.length).toBe(1)

        // time forward to the point when system asks about initiation

        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.context.requestTaskQueue()

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
        const votesBefore = world.chief.member.votes.length

        const rateChiefWisdomButtons = getInlineKeyCallbacks(rateChiefWisdomUpd)
        expect(rateChiefWisdomButtons.length).toBe(6)
        await world.newUser.chatLast(rateChiefWisdomButtons[3])
        expect(world.chief.member.votes.length).toBe(votesBefore + 1)

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

        // shaman receives application
        const shamanUpdates = await world.shaman.chat()
        expect(shamanUpdates.length).toBe(1)
        const shamanNotice = shamanUpdates[0]
        expect(shamanNotice.message.text).toMatch(coverLetter)
        const shamanNotButtons = getInlineKeyCallbacks(shamanNotice)
        expect(shamanNotButtons).toEqual([
            jasmine.stringMatching(`negotiate-quest`),
            jasmine.stringMatching(`decline-application`),
        ])

        // shaman proposes a meeting
        const shCalendar = await world.shaman.chatLast(shamanNotButtons[0])
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
        await world.shaman.chat(shProposalPromptButtons[0], true)

        // user gets shaman's proposal
        const shamansProposalUpd = await world.newUser.chat()
        expect(shamansProposalUpd.length).toBe(1)
        const shamansProposalButtons = getInlineKeyCallbacks(
            shamansProposalUpd[0]
        )
        await world.newUser.chat(shamansProposalButtons[0])
        // shaman receives note that quest accepted
        const shUserAgreedUpd = await world.shaman.chat()
        expect(shUserAgreedUpd.length).toBe(1)

        // time forward to the point when system asks about initiation

        const howWasInitTask2 = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask2!.time + 1000))
        await world.context.requestTaskQueue()

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
        const shVotesBefore = world.shaman.member.votes.length
        const rateShamanWisdomButtons =
            getInlineKeyCallbacks(rateShamanWisdomUpd)
        expect(rateShamanWisdomButtons.length).toBe(6)
        await world.newUser.chatLast(rateShamanWisdomButtons[3])
        expect(world.shaman.member.votes.length).toBe(shVotesBefore + 1)

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

        // new user is notified on their approval
        const acceptedUpdate = await world.newUser.chat()
        expect(acceptedUpdate.length).toBe(1)

        // time forward to the point when intro task was allocated
        const introTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(introTask!.time + 1000))
        await world.context.requestTaskQueue()

        // the old user recieves invitation to make an intro quest
        const oldieUpds = await world.oldie1.chat()
        expect(oldieUpds.length).toBe(1)

        // only now we can add oldie2, because intro tasks assigned randomly
        const oldie2 = await world.addOldie2()

        const oldieOk = getInlineKeyCallbacks(oldieUpds[0])[0]
        const oldieCalendar = await world.oldie1.chatLast(oldieOk)
        const olDates = getInlineKeyCallbacks(oldieCalendar).filter((cb) =>
            cb.includes('date')
        )
        const olHour = getInlineKeyCallbacks(
            await world.oldie1.chatLast(olDates[6]!, true)
        )[6]
        const olMinutes = getInlineKeyCallbacks(
            await world.oldie1.chatLast(olHour, true)
        )[0]
        await world.oldie1.chat(olMinutes, true)
        const olConfirm = getInlineKeyCallbacks(
            await world.oldie1.chatLast('Go Bla-blakr bar!')
        )
        await world.oldie1.chat(olConfirm[0], true)

        // new member recieves invitation on intro quest
        const introUpd = await world.newUser.chat()
        expect(introUpd.length).toBe(1)
        const introAgree = getInlineKeyCallbacks(introUpd[0])[0]
        await world.newUser.chat(introAgree)

        // oldie notified that newbie agreed
        expect((await world.oldie1.chat()).length).toBe(1)

        // time forward to the point when intro task was alocated
        const introRateTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(introRateTask!.time + 1000))
        await world.context.requestTaskQueue()

        // newbie is asked to rate oldie's charisma & wisdom
        const oldRateUpd = await world.newUser.chat()
        expect(oldRateUpd.length).toBe(1)
        const rateOldieCharismaButtons = getInlineKeyCallbacks(oldRateUpd[0])
        expect(rateOldieCharismaButtons.length).toBe(6)
        const rateOldieWisdomUpd = await world.newUser.chatLast(
            rateOldieCharismaButtons[5],
            true
        )
        const rateOldieWisdomButtons = getInlineKeyCallbacks(rateOldieWisdomUpd)
        expect(rateOldieWisdomButtons.length).toBe(6)
        await world.newUser.chatLast(rateOldieWisdomButtons[3])
        const oldieMember = await world.context.stores.memberStore.getById(
            world.oldie1.member.id
        )
        expect(oldieMember?.votes.length).toBe(1)

        // oldie is asked to rate newbie's charisma & wisdom
        const newbieRateUpd = await world.oldie1.chat()
        expect(newbieRateUpd.length).toBe(1)
        const rateNewbieCharismaButtons = getInlineKeyCallbacks(
            newbieRateUpd[0]
        )
        expect(rateNewbieCharismaButtons.length).toBe(6)
        const rateNewbieWisdomUpd = await world.oldie1.chatLast(
            rateNewbieCharismaButtons[5],
            true
        )
        const rateNewbieWisdomButtons =
            getInlineKeyCallbacks(rateNewbieWisdomUpd)
        expect(rateNewbieWisdomButtons.length).toBe(6)
        await world.oldie1.chatLast(rateNewbieWisdomButtons[3])
        const newbieMember = await world.context.stores.memberStore.getById(
            newUserMember.id
        )
        expect(newbieMember?.votes.length).toBe(1)

        // now oldie 2 is notified on intro quest

        // time forward to the point when intro task was allocated
        const intro2Task = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(intro2Task!.time + 1000))
        await world.context.requestTaskQueue()

        const oldie2Upds = await oldie2.chat()
        expect(oldie2Upds.length).toBe(1)
    })

    it('Shows tribes list on location sharing', async () => {
        pending('need to implement location query')
        await world.newUser.chatLast('/start')
        const response = await world.newUser.chatLast('list-tribes')
        // should have button for sharing location
        const btn = getKeyboardButtons(response)[0]
        expect(btn).toBeTruthy()
        expect(typeof btn === 'object' && 'request_location' in btn).toBeTrue()
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
        const updates = await world.newUser.chat()
        expect(updates.length).toBe(1)
    })

    it('Shows errors (phase mismatch)', async () => {
        await world.newUser.chatLast('/start')
        await world.newUser.chat('list-tribes')
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        const tribeListItem = tribesListUpdate[tribesListUpdate.length - 1]
        const applyButton = getInlineKeyCallbacks(tribeListItem)[0]
        await world.newUser.chatLast(applyButton)
        await world.newUser.chat('I want to FOO!!')
        const chiefUpdates = await world.chief.chat()
        const chiefNote = chiefUpdates[0]
        const chiefNotButtons = getInlineKeyCallbacks(chiefNote)

        // Chief set's date
        const calendar = await world.chief.chatLast(chiefNotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
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
        await world.chief.chat(proposalPromptButtons[0], true)

        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        const agreeBtn = userNotifButtons.find((b) => b.startsWith('agree'))
        await world.newUser.chatLast(agreeBtn)

        // chief notified on confirmation
        await world.chief.chat()
        // time forward to the point when system asks about initiation
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.context.requestTaskQueue()

        // chief accepts member
        const chiefFeedbackUpd = await world.chief.chat()
        const chiefFeedbackButtons = getInlineKeyCallbacks(chiefFeedbackUpd[0])
        const chiefAcceptButton = chiefFeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await world.chief.chat(chiefAcceptButton, true)
        // new user is asked to rate chief...
        await world.newUser.chat()

        // Now Chief changes their mind, but it's handed over to Shaman
        const chiefDeclineButton = chiefFeedbackButtons.find((b) =>
            b.startsWith('application-decline')
        )!

        await world.chief.forceCallback(chiefDeclineButton)
    })
    it('Accepts member without shaman initiation, if tribe has no shaman', async () => {
        await world.newUser.chatLast('/start')
        await world.newUser.chat('list-tribes')
        const tribesListUpdate = await world.newUser.chat(world.city.name)
        const tribeListItem = tribesListUpdate[tribesListUpdate.length - 1]
        const applyButton = getInlineKeyCallbacks(tribeListItem)[0]
        await world.newUser.chatLast(applyButton)
        await world.newUser.chat('I want to FOO!!')
        const chiefUpdates = await world.chief.chat()
        const chiefNote = chiefUpdates[0]
        const chiefNotButtons = getInlineKeyCallbacks(chiefNote)

        // Chief set's date
        const calendar = await world.chief.chatLast(chiefNotButtons[0])
        const dates = getInlineKeyCallbacks(calendar).filter((cb) =>
            cb.includes('date')
        )
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
        await world.chief.chat('confirm-proposal', true)

        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        await world.newUser.chatLast(userNotifButtons[0])

        // chief notified on confirmation
        await world.chief.chat()
        // time forward to the point when system asks about initiation
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.context.requestTaskQueue()
        // new user is asked to rate chief...
        const rateUpd = await world.newUser.chat()
        const charismaButtons = getInlineKeyCallbacks(rateUpd[0])
        const wisdomUpd = await world.newUser.chatLast(charismaButtons[5], true)
        const wisdomButtons = getInlineKeyCallbacks(wisdomUpd)
        await world.newUser.chatLast(wisdomButtons[3])

        world.tribes[1].shamanId = null
        await world.context.stores.tribeStore.save(world.tribes[1])
        // chief accepts member
        const chiefFeedbackUpd = await world.chief.chat()
        const chiefFeedbackButtons = getInlineKeyCallbacks(chiefFeedbackUpd[0])
        const chiefAcceptButton = chiefFeedbackButtons.find((b) =>
            b.startsWith('application-accept:')
        )!
        await world.chief.chat(chiefAcceptButton, true)

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

    const chief = await addTribeMember(
        makeClient('BarBar Monster', 'Tribe Chief'),
        tribes[1].id
    )
    await context.addVotes(chief.member, 5, 3)
    const shaman = await addTribeMember(
        makeClient('Barlog', 'Tribe Shaman'),
        tribes[1].id
    )
    await context.addVotes(shaman.member, 3, 5)
    const oldie1 = await addTribeMember(
        makeClient('Oldie Bar', 'Old User 1'),
        tribes[1].id
    )
    const newUser = makeClient('Newbie', 'Applicant')

    await context.stores.tribeStore.save({
        ...tribes[1],
        chiefId: chief.member.id,
        shamanId: shaman.member.id,
    })

    return {
        addOldie2: async () => {
            return await addTribeMember(
                makeClient('Oldie Garr', 'Old User 2'),
                tribes[1].id
            )
        },
        chief,
        shaman,
        oldie1,
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
