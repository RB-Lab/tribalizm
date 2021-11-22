import { Awaited } from '../../ts-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { Scheduler } from '../../use-cases/utils/scheduler'
import { TaskDiscpatcher } from '../../use-cases/utils/task-dispatcher'
import { createContext } from '../test-context'
import {
    createTelegramContext,
    getInlineKeyCallbacks,
    getKeyboardButtons,
} from './bot-utils'
import { IMember } from '../../use-cases/entities/member'

function xdescribe(...args: any[]) {}
describe('Get into tribe [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        world = await setup()
    })
    afterEach(async () => {
        await world.tearDown()
    })

    it('apply to tribe, initiate new member, introduce to tribe', async () => {
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
        // to fix that it's probably better use jasmine.clocks for the whole suite
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
        await world.requestTaskQueue()
        jasmine.clock().uninstall()

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

        // shaman recieves application
        const shamanUpdates = await world.shaman.chat()
        expect(shamanUpdates.length).toBe(1)
        const shamanNotice = shamanUpdates[0]
        expect(shamanNotice.message.text).toMatch(coverLetter)
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
        await world.requestTaskQueue()
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

        // new user is notified on thier approval
        const acceptedUpdate = await world.newUser.chat()
        expect(acceptedUpdate.length).toBe(1)

        // time forward to the point when intro task was alocated
        jasmine.clock().install()
        const introTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(introTask!.time + 1000))
        await world.requestTaskQueue()
        jasmine.clock().uninstall()

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
        jasmine.clock().install()
        const introRateTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(introRateTask!.time + 1000))
        await world.requestTaskQueue()
        jasmine.clock().uninstall()

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
        const newbieieMember = await world.context.stores.memberStore.getById(
            newUserMember.id
        )
        expect(newbieieMember?.votes.length).toBe(1)

        // now oldie 2 is notified on intro quest

        // time forward to the point when intro task was alocated
        jasmine.clock().install()
        const intro2Task = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(intro2Task!.time + 1000))
        await world.requestTaskQueue()
        jasmine.clock().uninstall()

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
        const propose = chiefNotButtons.find((b) => b.startsWith('propose'))
        const calendar = await world.chief.chatLast(propose!)
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
        expect(proposalPromptButtons).toEqual([
            'confirm-proposal',
            'redo-proposal',
        ])
        await world.chief.chat('confirm-proposal', true)

        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        const agreeBtn = userNotifButtons.find((b) => b.startsWith('agree'))
        await world.newUser.chatLast(agreeBtn)

        // chief notified on confirmation
        await world.chief.chat()
        // time forward to the point when system asks about initiation
        jasmine.clock().install()
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.requestTaskQueue()
        jasmine.clock().uninstall()

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

        await world.chief.client.sendCallback(
            world.chief.client.makeCallbackQuery(chiefDeclineButton)
        )
        await world.chief.chat()
    })
    fit('Accepts member without shaman initiation, if tribe has no shaman', async () => {
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
        const propose = chiefNotButtons.find((b) => b.startsWith('propose'))
        const calendar = await world.chief.chatLast(propose!)
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
        expect(proposalPromptButtons).toEqual([
            'confirm-proposal',
            'redo-proposal',
        ])
        await world.chief.chat('confirm-proposal', true)

        process.env.chatDebug = 'true'
        // new user agrees
        const userUpdate = await world.newUser.chatLast()
        const userNotifButtons = getInlineKeyCallbacks(userUpdate)
        const agreeBtn = userNotifButtons.find((b) => b.startsWith('agree'))
        await world.newUser.chatLast(agreeBtn)

        // chief notified on confirmation
        await world.chief.chat()
        // time forward to the point when system asks about initiation
        jasmine.clock().install()
        const howWasInitTask = await world.context.stores.taskStore._last()
        jasmine.clock().mockDate(new Date(howWasInitTask!.time + 1000))
        await world.requestTaskQueue()
        jasmine.clock().uninstall()
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

        // new user is notified on their accepance
        const upd = await world.newUser.chat()
        expect(upd.length).toBe(1)
    })
})

async function setup() {
    // process.env.chatDebug = 'true'

    const context = await createContext()
    const { server, addTribeMember, makeClient, bot } =
        await createTelegramContext(context)

    const scheduler = new Scheduler(context.stores.taskStore)
    const taskDiscpatcher = new TaskDiscpatcher(context.tribalism, scheduler)

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

    const chief = await addTribeMember(
        makeClient('BarBar Monster', 'Tribe Chief'),
        tribes[1].id
    )
    await addVotes(chief.member, 5, 3)
    const shaman = await addTribeMember(
        makeClient('Barlog', 'Tribe Shaman'),
        tribes[1].id
    )
    await addVotes(shaman.member, 3, 5)
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

    async function addVotes(member: IMember, c: number, w: number) {
        const arr = Array(5).fill(0)
        arr.forEach(() => {
            member.castVote({
                casted: 0,
                charisma: c,
                wisdom: w,
                memberId: 'dd',
                questId: 'dfw',
                type: 'quest-vote',
            })
        })
        context.stores.memberStore.save(member)
    }

    return {
        requestTaskQueue: async () => {
            if (process.env.chatDebug) {
                const tasks = await context.stores.taskStore.find({
                    done: false,
                })
                console.log(
                    `--- Now is ${new Date()}. Dispatching tasks: ${
                        tasks.length
                    } ---`
                )
            }
            await taskDiscpatcher.run()
        },
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
