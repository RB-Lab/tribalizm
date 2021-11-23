import { Storable, Store } from '../../../use-cases/entities/store'
import { User, UserStore } from '../../../use-cases/entities/user'

export interface TelegramUserStore extends Store<ITelegramUser> {}

interface UserState {
    type: 'string'
}

export interface ITelegramUser {
    userId: string
    chatId: string
    username?: string
    locale?: string
    state?: UserState
}

export type SavetdTelegramUser = ITelegramUser & Storable

export class TelegramUser implements SavetdTelegramUser {
    private store: TelegramUserStore
    id: string
    userId: string
    chatId: string
    username?: string
    locale?: string
    state?: UserState
    constructor(store: TelegramUserStore, data: SavetdTelegramUser) {
        this.id = data.id
        this.userId = data.userId
        this.chatId = data.chatId
        this.username = data.username
        this.locale = data.locale
        this.store = store
    }
    async setState(state: UserState) {
        this.state = state
        this.store.save({ ...this, state })
    }
}

export interface TelegramUsersAdapter {
    /**
     * @reurns new user id
     */
    createUser: (
        name: string,
        providerData: Omit<ITelegramUser, 'userId'>
    ) => Promise<TelegramUser>
    getUserByChatId: (chatId: string | number) => Promise<TelegramUser | null>
    getTelegramUserForTribalism: (userId: string) => Promise<TelegramUser>
}

export class StoreTelegramUsersAdapter implements TelegramUsersAdapter {
    private userStore: UserStore
    private tgUserStore: TelegramUserStore
    constructor(userStore: UserStore, telegramUserStore: TelegramUserStore) {
        this.userStore = userStore
        this.tgUserStore = telegramUserStore
    }
    async createUser(name: string, tgData: Omit<ITelegramUser, 'userId'>) {
        // TODO begin transaction
        const user = await this.userStore.save(
            new User({
                name,
            })
        )
        const savedUser = await this.tgUserStore.save({
            chatId: tgData.chatId,
            userId: user.id,
            locale: tgData.locale,
            username: tgData.username,
        })
        return new TelegramUser(this.tgUserStore, savedUser)
    }
    async getUserByChatId(chatId: string | number) {
        const users = await this.tgUserStore.find({ chatId: String(chatId) })
        return users.length
            ? new TelegramUser(this.tgUserStore, users[0])
            : null
    }
    async getTelegramUserForTribalism(tribalismUserId: string) {
        const users = await this.tgUserStore.find({ userId: tribalismUserId })

        if (!users.length) {
            throw new Error(`User ${tribalismUserId} does not use telegram`)
        }

        return new TelegramUser(this.tgUserStore, users[0])
    }
}
