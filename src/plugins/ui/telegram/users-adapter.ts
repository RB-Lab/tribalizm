import { Storable, Store } from '../../../use-cases/entities/store'
import { User, UserStore } from '../../../use-cases/entities/user'
import { ILogger } from '../../../use-cases/utils/logger'

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
    id?: string | null
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

export type SavedTelegramUser = ITelegramUser & Storable

export class TelegramUser implements SavedTelegramUser {
    private store: TelegramUserStore
    private logger?: ILogger
    id: string
    userId: string
    chatId: string
    username?: string
    locale?: string
    state?: UserState
    constructor(
        store: TelegramUserStore,
        data: SavedTelegramUser,
        logger?: ILogger
    ) {
        this.id = data.id
        this.userId = data.userId
        this.chatId = data.chatId
        this.username = data.username
        this.locale = data.locale
        this.store = store
        this.state = data.state
        this.logger = logger
    }
    async setState<T extends UserState>(state: T | null) {
        if (state) {
            this.logger?.trace(`set-user-state: ${state.type}`, state)
            this.state = state
        } else {
            this.logger?.trace(
                `droop-user-state, was: ${this.state?.type || 'null'}`
            )
            delete this.state
        }
        await this.store.save({
            id: this.id,
            chatId: this.chatId,
            userId: this.userId,
            locale: this.locale,
            state: this.state,
            username: this.username,
        })
    }
}

export interface TelegramUsersAdapter {
    /**
     * @returns new user id
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
    private logger?: ILogger
    constructor(
        userStore: UserStore,
        telegramUserStore: TelegramUserStore,
        logger?: ILogger
    ) {
        this.userStore = userStore
        this.tgUserStore = telegramUserStore
        this.logger = logger
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
        return new TelegramUser(this.tgUserStore, savedUser, this.logger)
    }

    /**
     * @param chatId Telegram's chat id
     * @returns telegram user object. Tribalizm user id is included in it
     */
    async getUserByChatId(chatId: string | number) {
        const users = await this.tgUserStore.find({ chatId: String(chatId) })
        return users.length
            ? new TelegramUser(this.tgUserStore, users[0], this.logger)
            : null
    }
    /**
     * @param tribalismUserId userId in Tribalism system
     * @returns telegram user instance that map to one in Tribalizm, whose ID provided
     */
    async getTelegramUserForTribalism(tribalismUserId: string) {
        const users = await this.tgUserStore.find({ userId: tribalismUserId })

        if (!users.length) {
            throw new Error(`User ${tribalismUserId} does not use telegram`)
        }

        return new TelegramUser(this.tgUserStore, users[0], this.logger)
    }
}
