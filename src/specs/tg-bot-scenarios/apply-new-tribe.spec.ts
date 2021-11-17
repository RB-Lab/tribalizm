import TelegramServer from 'telegram-test-api'
import { createContext } from '../test-context'
import { makeBot } from '../../plugins/ui/telegram/bot'
import { StoreTelegramUsersAdapter } from '../../plugins/ui/telegram/users-adapter'
import {
    getInlineKeyCallbacks,
    getKeyboardButtons,
    makeChat,
} from './bot-utils'
import { City } from '../../use-cases/entities/city'
import { Tribe } from '../../use-cases/entities/tribe'
import { Awaited } from '../../ts-utils'
import { Member } from '../../use-cases/entities/member'

fdescribe('Apply tribe [integration]', () => {
    let world: Awaited<ReturnType<typeof setup>>
    beforeEach(async () => {
        world = await setup()
    })
    afterEach(async () => {
        await world.tearDown()
    })

    it('shows new user tribes & rules', async () => {
        const update = await world.chat('/start')
        const callbacks = getInlineKeyCallbacks(update)
        expect(callbacks).toEqual(['list-tribes', 'rules'])
    })

    it('asks for location', async () => {
        await world.chat('/start')
        const response = await world.chat('list-tribes')
        const btn = getKeyboardButtons(response)[0]
        expect(btn).toBeTruthy()
        expect(typeof btn === 'object' && 'request_location' in btn).toBeTrue()
    })

    // TODO add location to test API client
    // xit('shows tribes list on location sharing')

    it('shows tribes list for city name', async () => {
        await world.chat('/start')
        await world.chat('list-tribes')
        await world.client.sendMessage(
            world.client.makeMessage(world.city.name)
        )
        const updates = await world.client.getUpdates()
        expect(updates.result.length).toBe(world.tribes.length + 1)
        expect(updates.result[0].message.text).toMatch(world.city.name)
        const markup = updates.result[0].message.reply_markup
        expect(markup && 'remove_keyboard' in markup).toBeTrue()
    })

    it('asks for cover letter when user applies to tribe', async () => {
        await world.chat('/start')
        await world.chat('list-tribes')
        const lastTribeReply = await world.chat(world.city.name)
        const button = getInlineKeyCallbacks(lastTribeReply)[0]
        expect(button).toMatch('apply-tribe')
        const reply = await world.chat(button)
        const tribeId = button.replace('apply-tribe:', '')
        const tribe = world.tribes.find((t) => t.id === tribeId)
        expect(reply.message.text).toMatch(tribe!.name)
    })

    it('notifies chief on new application', async () => {
        await world.chat('/start')
        await world.chat('list-tribes')
        const lastTribeReply = await world.chat(world.city.name)
        await world.chat(getInlineKeyCallbacks(lastTribeReply)[0])

        await world.chat('I want to FOO!!')
        const updates = await world.chiefClient.getUpdates()
        expect(updates.result.length).toBe(1)
        const notif = updates.result[0]
        expect(notif.message.text).toMatch('I want to FOO!!')
        const app = await world.context.stores.applicationStore._last()
        expect(getInlineKeyCallbacks(notif)).toEqual([
            `propose-initiation:${app!.id}`,
            `decline-application:${app!.id}`,
        ])
    })

    describe('Decline application', () => {
        it('Notifies the user', async () => {
            await world.chat('/start')
            await world.chat('list-tribes')
            const lastTribeReply = await world.chat(world.city.name)
            await world.chat(getInlineKeyCallbacks(lastTribeReply)[0])

            await world.chat('I want to FOO!!')
            const chiefUpdates = await world.chiefChat()
            const buttons = getInlineKeyCallbacks(chiefUpdates)
            const decline = buttons.find((b) => b.startsWith('decline'))
            await world.chiefChat(decline!)
            await world.chiefChat('Because fuck off!')
            const updates = await world.client.getUpdates()
            expect(updates.result.length).toBe(1)
        })
    })
    describe('Propose initiation', () => {
        it('Notifies the applicant with poroposed date', async () => {
            await world.chat('/start')
            await world.chat('list-tribes')
            const lastTribeReply = await world.chat(world.city.name)
            await world.chat(getInlineKeyCallbacks(lastTribeReply)[0])

            await world.chat('I want to FOO!!')
            const chiefUpdates = await world.chiefChat()
            const buttons = getInlineKeyCallbacks(chiefUpdates)
            const propose = buttons.find((b) => b.startsWith('propose'))
            const proposeUpdate = await world.chiefChat(propose!)
            const date = getInlineKeyCallbacks(proposeUpdate).find((cb) =>
                cb.includes('date')
            )
            const hour = getInlineKeyCallbacks(
                await world.chiefChat(date!, true)
            )[4]
            const minutes = getInlineKeyCallbacks(
                await world.chiefChat(hour, true)
            )[2]
            await world.chiefChat(minutes, true)
            await world.chiefChat('Lets meet at Awesome Place Inn')
            // check proposal??
            await world.chiefChat('confirm-proposal', true)

            const userUpdate = await world.chat()
            expect(getInlineKeyCallbacks(userUpdate)).toEqual([
                'confirm-quest',
                'propose-quest-change',
            ])
        })
    })
})

async function setup() {
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

    const client = server.getClient(token, {
        firstName: 'New Member',
        userName: 'Applicant',
        chatId: 3,
        userId: 3,
    })
    const chat = makeChat(server, client)
    const chiefClient = server.getClient(token, {
        firstName: 'Chief',
        userName: 'TribeChief',
        chatId: 1,
        userId: 1,
    })
    const chiefChat = makeChat(server, chiefClient)
    await chiefChat('/start')
    const chiefUser = await context.stores.userStore._last()

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Novosibirsk',
        })
    )
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Tribe-1',
        }),
        new Tribe({
            cityId: city.id,
            name: 'Tribe-2',
        }),
    ])
    const chief = await context.stores.memberStore.save(
        new Member({
            tribeId: tribes[1].id,
            userId: chiefUser!.id,
            isCandidate: false,
            charisma: 10,
        })
    )
    await context.stores.tribeStore.save({
        ...tribes[1],
        chiefId: chief.id,
    })

    return {
        bot,
        client,
        chiefClient,
        city,
        tribes,
        context,
        chat,
        chiefChat,
        server,
        tearDown: async () => {
            bot.stop()
            await server.stop()
        },
    }
}
