import { Storable, Store } from '../../../use-cases/utils/store'
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
    timeZone?: string
    cityId?: string
    /** arbitrary data associated with user, i.e. permanent session */
    state?: UserState
}

export type SavedTelegramUser = ITelegramUser & Storable

export class TelegramUser implements SavedTelegramUser {
    private store: TelegramUserStore
    private logger: ILogger
    id: string
    userId: string
    chatId: string
    username?: string
    locale?: string
    state?: UserState
    timeZone?: string
    cityId?: string
    constructor(
        store: TelegramUserStore,
        logger: ILogger,
        data: SavedTelegramUser
    ) {
        this.id = data.id
        this.userId = data.userId
        this.chatId = data.chatId
        this.username = data.username
        this.locale = data.locale
        this.store = store
        this.state = data.state
        this.logger = logger
        this.timeZone = data.timeZone
        this.cityId = data.cityId
    }
    async setState<T extends UserState>(state: T | null) {
        if (state) {
            this.logger.trace(`set-user-state: ${state.type}`, {
                ...state,
                userId: this.userId,
            })
            this.state = state
        } else {
            this.logger?.trace(
                `droop-user-state, was: ${this.state?.type || 'null'}`,
                { userId: this.userId }
            )
            delete this.state
        }
        await this.save()
    }
    /**
     * Sets information about user's position
     */
    async locate(cityId: string, timeZone: string) {
        this.cityId = cityId
        this.timeZone = timeZone
        await this.save()
    }

    /**
     * Converts user defined date to server time (if timeZone is set)
     * @param date date that is made from user-defined **string**
     */
    toServerTime(date: Date) {
        return new Date(date.getTime() - this.getTimeDiff(date))
    }

    /**
     * Converts server-created date to user's timezone (if it is set)
     * @param date Date that is made from UTC time stamp
     * @returns Date that accounts for user time zone and server's offset
     */
    toUserTime(date: Date) {
        return new Date(date.getTime() + this.getTimeDiff(date))
    }

    private getTimeDiff(date: Date) {
        if (!this.timeZone) return 0
        const userTimeString = date.toLocaleString('en-US', {
            timeZone: this.timeZone,
        })

        return Date.parse(userTimeString) - date.getTime()
    }

    private async save() {
        await this.store.save({
            id: this.id,
            chatId: this.chatId,
            userId: this.userId,
            locale: this.locale,
            state: this.state,
            timeZone: this.timeZone,
            cityId: this.cityId,
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
    listTelegramUsers: (limit?: number, after?: string) => Promise<TgUserInfo[]>
}

export class StoreTelegramUsersAdapter implements TelegramUsersAdapter {
    private userStore: UserStore
    private tgUserStore: TelegramUserStore
    protected logger: ILogger
    constructor(
        userStore: UserStore,
        telegramUserStore: TelegramUserStore,
        logger: ILogger
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
        return new TelegramUser(this.tgUserStore, this.logger, savedUser)
    }

    /**
     * @param chatId Telegram's chat id
     * @returns telegram user object. Tribalizm user id is included in it
     */
    async getUserByChatId(chatId: string | number) {
        const users = await this.tgUserStore.findSimple({
            chatId: String(chatId),
        })
        return users.length
            ? new TelegramUser(this.tgUserStore, this.logger, users[0])
            : null
    }
    /**
     * @param tribalismUserId userId in Tribalism system
     * @returns telegram user instance that map to one in Tribalizm, whose ID provided
     */
    async getTelegramUserForTribalism(tribalismUserId: string) {
        const users = await this.tgUserStore.findSimple({
            userId: tribalismUserId,
        })
        if (!users.length) {
            throw new Error(`User ${tribalismUserId} does not use telegram`)
        }

        return new TelegramUser(this.tgUserStore, this.logger, users[0])
    }

    async listTelegramUsers(limit = 30, after?: string) {
        // TODO add pagination
        const users = await this.tgUserStore.findSimple({})
        return users.map((u) => ({
            tgUserName: u.username,
            userId: u.userId,
            locale: u.locale,
        }))
    }
}

interface TgUserInfo {
    tgUserName?: string
    userId: string
    locale?: string
}
