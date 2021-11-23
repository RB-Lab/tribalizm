import {
    ProvdierDataTelegram,
    StoredUser,
    User,
    UserStore,
} from '../../../use-cases/entities/user'

export interface TelegramUsersAdapter {
    /**
     * @reurns new user id
     */
    createUser: (
        name: string,
        providerData: ProvdierDataTelegram
    ) => Promise<string>
    getUserIdByChatId: (chatId: string | number) => Promise<string | null>
    getChatDataByUserId: (
        userId: string
    ) => Promise<{ locale: string; chatId: string }>
}

export class StoreTelegramUsersAdapter implements TelegramUsersAdapter {
    private userStore: UserStore
    constructor(userStore: UserStore) {
        this.userStore = userStore
    }
    async createUser(name: string, providerData: ProvdierDataTelegram) {
        return (
            await this.userStore.save(
                new User({
                    name,
                    provider: {
                        telegram: providerData,
                    },
                })
            )
        ).id
    }
    async getUserIdByChatId(chatId: string | number) {
        const users = await this.userStore.find({
            provider: { telegram: { chatId: String(chatId) } },
        })
        return users.length ? users[0].id : null
    }
    async getChatDataByUserId(userId: string) {
        const user = await this.userStore.getById(userId)
        if (!user?.provider.telegram) {
            throw new Error(`User ${userId} does not use telegram`)
        }

        // for some reason it doesn't change type after check...
        return {
            locale: user.provider.telegram.locale || 'en',
            chatId: user.provider.telegram.chatId,
        }
    }
}
