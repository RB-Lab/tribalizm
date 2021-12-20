import { createContext } from '../../../specs/test-context'
import { noop } from '../../../ts-utils'
import { Admin } from '../../../use-cases/admin'
import { City, StoredCity } from '../../../use-cases/entities/city'
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
    SavedTelegramUser,
    StoreTelegramUsersAdapter,
    TelegramUser,
} from './users-adapter'

class TgUserStore extends InMemoryStore<ITelegramUser> {}

const myChatId = '217518902'

export class MockTgUserAdapter extends StoreTelegramUsersAdapter {
    user: SavedTelegramUser = {
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

    setCity(city: StoredCity) {
        this.user.cityId = city.id
        this.user.timeZone = city.timeZone
    }
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
    telegramUsersAdapter.setCity(city)
    const tribes = await context.stores.tribeStore.saveBulk([
        new Tribe({
            cityId: city.id,
            name: 'Lex Fridman podcast discussion group',
            description:
                'Here we discuss Lex Fridman podcast and related stuff',
            logo: 'https://downculture.files.wordpress.com/2019/05/img_6103.png',
        }),
        new Tribe({
            cityId: city.id,
            name: 'SpaceX gazers',
            description:
                '🚀 We love to look at stuff in Boca Chica from the other side of the Earth. ' +
                'Yeah, it will definitely change the way we explore space and make humans ' +
                'not only multi-planetary species but also a space faring civilization!!! \n' +
                "So excited about this, can't wait to get excited together!! 🚀",
            logo: 'https://cdn.images.express.co.uk/img/dynamic/151/750x445/1324925.jpg',
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
        new User({ name: 'R.B.', cityId: city.id }),
    ])
    admin.addTribeMember({ tribeId: tribes[0].id, userId: users[0].id })
    admin.addTribeMember({ tribeId: tribes[1].id, userId: users[1].id })
    admin.addTribeMember({ tribeId: tribes[2].id, userId: users[2].id })
    telegramUsersAdapter.user.userId = users[3].id

    // context.tribalizm.tribesShow.getTribeInfo = (req) =>
    //     Promise.resolve({
    //         id: req.tribeId,
    //         description: tribes[0].description,
    //         isInTribe: false,
    //         logo: '',
    //         membersCount: 23,
    //         name: tribes[0].name,
    //     })
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
