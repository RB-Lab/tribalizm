import {
    ProvdierDataTelegram,
    StoredUser,
    User,
    UserStore,
} from '../../../use-cases/entities/user'

export interface TelegramUsersAdapter {
    createUser: (
        name: string,
        providerData: ProvdierDataTelegram
    ) => Promise<void>
    getUserByChatId: (chatId: string | number) => Promise<StoredUser | null>
    getUserById: (
        userId: string
    ) => Promise<StoredUser & { provider: { telegram: ProvdierDataTelegram } }>
}

export class StoreTelegramUsersAdapter implements TelegramUsersAdapter {
    private userStore: UserStore
    constructor(userStore: UserStore) {
        this.userStore = userStore
    }
    async createUser(name: string, providerData: ProvdierDataTelegram) {
        await this.userStore.save(
            new User({
                name,
                provider: {
                    telegram: providerData,
                },
            })
        )
    }
    async getUserByChatId(chatId: string | number) {
        const users = await this.userStore.find({
            provider: { telegram: { chatId: String(chatId) } },
        })
        return users[0] || null
    }
    async getUserById(userId: string) {
        const user = await this.userStore.getById(userId)
        if (!user?.provider.telegram) {
            throw new Error(`User ${userId} does not use telegram`)
        }

        // for some reason it doesn't change type after check...
        return user as StoredUser & {
            provider: { telegram: ProvdierDataTelegram }
        }
    }
}
