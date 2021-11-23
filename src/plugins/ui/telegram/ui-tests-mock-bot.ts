import { createContext } from '../../../specs/test-context'
import { City } from '../../../use-cases/entities/city'
import { Tribe } from '../../../use-cases/entities/tribe'
import { TestNotificationBus } from '../../notification-bus'
import { InMemoryStore } from '../../stores/in-memory-store/in-memory-store'
import { makeBot } from './bot'
import { testLauncher } from './screens/test-launcher'
import { ITelegramUser, StoreTelegramUsersAdapter } from './users-adapter'

class TgUserStore extends InMemoryStore<ITelegramUser> {}

export class MockTgUserAdapter extends StoreTelegramUsersAdapter {
    private findDisabled = false
    togleDisableFind = () => {
        this.findDisabled = !this.findDisabled
        console.log(`find ${this.findDisabled ? 'disabled' : 'enabled'}`)
    }
    async getUserByChatId(chatId: string | number) {
        if (this.findDisabled) {
            return null
        }
        return super.getUserByChatId(chatId)
    }
}
async function run() {
    const token = process.env.BOT_KEY_TEST1

    const notifcationsBus = new TestNotificationBus()
    const { tribalism, stores } = await createContext()
    const telegramUsersAdapter = new MockTgUserAdapter(
        stores.userStore,
        new TgUserStore()
    )

    const city = await stores.cityStore.save(
        new City({
            name: 'Aya Napa',
        })
    )
    stores.tribeStore.saveBulk([
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
    makeBot({
        telegramUsersAdapter,
        webHook: {
            path: '/tg-hook',
            port: 3000,
            domain: 'tribalizm-1.rblab.net',
        },
        tribalism: tribalism as any,
        token,
        notifcationsBus,
    }).then((bot) => {
        testLauncher(bot, telegramUsersAdapter)
    })

    process.stdin.on('data', (d) => {
        telegramUsersAdapter.togleDisableFind()
    })
}

run()
