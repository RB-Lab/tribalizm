import { createContext } from '../../../specs/test-context'
import { noop } from '../../../ts-utils'
import { Admin } from '../../../use-cases/admin'
import { City } from '../../../use-cases/entities/city'
import { Tribe } from '../../../use-cases/entities/tribe'
import { User } from '../../../use-cases/entities/user'
import { ILogger } from '../../../use-cases/utils/logger'
import { Logger } from '../../logger'
import { InMemoryStore } from '../../stores/in-memory-store/in-memory-store'
import { makeBot } from './bot'
import { TelegramMessageInMemoryStore } from './message-store'
import { testLauncher } from './screens/test-launcher'
import {
    ITelegramUser,
    StoreTelegramUsersAdapter,
    TelegramUser,
} from './users-adapter'

class TgUserStore extends InMemoryStore<ITelegramUser> {}

const myChatId = '217518902'

export class MockTgUserAdapter extends StoreTelegramUsersAdapter {
    user = {
        id: '8768',
        chatId: myChatId,
        userId: 'whatever',
        locale: 'en',
        username: 'tribe-spirit',
    }
    private store = {
        find: async () => [this.user],
        findSimple: async () => [this.user],
        getById: async () => this.user,
        save: async (d: any) => {
            this.user = d
            return this.user as any
        },
        saveBulk: async () => [this.user as any],
    }
    async createUser() {
        return new TelegramUser(this.store, this.logger, this.user)
    }

    getUserByChatId = async () =>
        new TelegramUser(this.store, this.logger, this.user)
    getTelegramUserForTribalism = async () =>
        new TelegramUser(this.store, this.logger, this.user)
}
async function run() {
    const context = await createContext()
    const tgStore = new TgUserStore()
    const logger = new Logger()
    const telegramUsersAdapter = new MockTgUserAdapter(
        context.stores.userStore,
        tgStore,
        logger
    )
    const admin = new Admin(context)

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Oslo',
            timeZone: 'Europe/Oslo',
        })
    )
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Lex Fridman podcast discussion group',
            description:
                'Here we discuss Lex Fridman podcast and related stuff',
        }),
        new Tribe({
            cityId: city.id,
            name: 'SpaceX gazers',
            description:
                'We love to look at stuff in Boca Chica from the other side of the Earth',
        }),
        new Tribe({
            cityId: city.id,
            name: 'Less Wrong Aya Napa',
            description: 'The Rational People Tribe!',
        }),
    ])
    const users = await context.stores.userStore.saveBulk([
        new User({ name: 'Joe Rogan' }),
        new User({ name: 'Marcus House' }),
        new User({ name: 'Eliser U' }),
        new User({ name: 'R.B.' }),
    ])
    admin.addTribeMember({ tribeId: tribes[0].id, userId: users[0].id })
    admin.addTribeMember({ tribeId: tribes[1].id, userId: users[1].id })
    admin.addTribeMember({ tribeId: tribes[2].id, userId: users[2].id })
    telegramUsersAdapter.user.userId = users[3].id

    makeBot({
        logger,
        metrics: {
            countErrors: noop,
        },
        telegramUsersAdapter,
        webHook: {
            path: '/tg-hook',
            port: 3000,
            domain: 'tribalizm-1.rblab.net',
        },
        tribalizm: context.tribalizm,
        token: process.env.BOT_TOKEN,
        notificationBus: context.async.notificationBus,
        messageStore: new TelegramMessageInMemoryStore(),
    }).then((bot) => {
        testLauncher(bot, telegramUsersAdapter)
    })
}

run()
