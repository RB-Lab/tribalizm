import { Storable, Store } from '../../../use-cases/entities/store'
import { User, UserStore } from '../../../use-cases/entities/user'

export interface TelegramUserStore extends Store<ITelegramUser> {}

/** arbitrary data associated with user, i.e. permanent session */
export interface UserState {
    /**
     * type of the state is necessary to determine which kind of data is currently available in
     * state
     */
    type: string
}

export interface ITelegramUser {
    /** user id in  Tribalizm system */
    userId: string
    /** Telegram chat id */
    chatId: string
    /** Telegram username (e.g. @rombek) */
    username?: string
    locale?: string
    /** arbitrary data associated with user, i.e. permanent session */
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
        this.state = data.state
    }
    async setState<T extends UserState>(state: T) {
        this.state = state
        await this.store.save({ ...this, state })
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
    /**
     * Creates user both in Telegram's user store and in Tribalizm system
     * @param tgData data provided by Telegram chat object
     */
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

    /**
     * @param chatId Telegram's chat id
     * @returns telegram user object. Tribalizm user id is included in it
     */
    async getUserByChatId(chatId: string | number) {
        const users = await this.tgUserStore.find({ chatId: String(chatId) })
        return users.length
            ? new TelegramUser(this.tgUserStore, users[0])
            : null
    }
    /**
     * @param tribalismUserId userId in Tribalism system
     * @returns telegarm user instans that map to one in Tribalizm, whos ID provided
     */
    async getTelegramUserForTribalism(tribalismUserId: string) {
        const users = await this.tgUserStore.find({ userId: tribalismUserId })

        if (!users.length) {
            throw new Error(`User ${tribalismUserId} does not use telegram`)
        }

        return new TelegramUser(this.tgUserStore, users[0])
    }
}
