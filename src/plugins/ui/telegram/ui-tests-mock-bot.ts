import { createContext } from '../../../specs/test-context'
import { Admin } from '../../../use-cases/admin'
import { City } from '../../../use-cases/entities/city'
import { Tribe } from '../../../use-cases/entities/tribe'
import { User } from '../../../use-cases/entities/user'
import { InMemoryStore } from '../../stores/in-memory-store/in-memory-store'
import { makeBot } from './bot'
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
        getById: async () => this.user,
        save: async (d: any) => {
            this.user = d
            return this.user as any
        },
        saveBulk: async () => [this.user as any],
    }
    async createUser() {
        return new TelegramUser(this.store, this.user)
    }

    getUserByChatId = async () => new TelegramUser(this.store, this.user)
    getTelegramUserForTribalism = async () =>
        new TelegramUser(this.store, this.user)
}
async function run() {
    const token = process.env.BOT_KEY_TEST1

    const context = await createContext()
    const tgStore = new TgUserStore()
    const telegramUsersAdapter = new MockTgUserAdapter(
        context.stores.userStore,
        tgStore
    )
    const admin = new Admin(context)

    const city = await context.stores.cityStore.save(
        new City({
            name: 'Aya Napa',
        })
    )
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Lex Fridman podcast descussion group',
            description:
                'Here we discuss Lex fridman podcast and related stuff',
        }),
        new Tribe({
            cityId: city.id,
            name: 'SpaceX gasers',
            description:
                'We love to look at stuf in Boca Chica from the other side of the Earth',
        }),
        new Tribe({
            cityId: city.id,
            name: 'Less Wrong Aya Napa',
            description: 'The Rationa People Tribe!',
        }),
    ])
    const users = await context.stores.userStore.saveBulk([
        new User({ name: 'Joe Rogan' }),
        new User({ name: 'Marcus House' }),
        new User({ name: 'Eliser U' }),
        new User({ name: 'R.B.' }),
    ])
    admin.addTribeMemer({ tribeId: tribes[0].id, userId: users[0].id })
    admin.addTribeMemer({ tribeId: tribes[1].id, userId: users[1].id })
    admin.addTribeMemer({ tribeId: tribes[2].id, userId: users[2].id })
    telegramUsersAdapter.user.userId = users[3].id

    makeBot({
        telegramUsersAdapter,
        webHook: {
            path: '/tg-hook',
            port: 3000,
            domain: 'tribalizm-1.rblab.net',
        },
        tribalism: context.tribalism,
        token,
        notifcationsBus: context.async.notififcationBus,
    }).then((bot) => {
        testLauncher(bot, telegramUsersAdapter)
    })
}

run()
