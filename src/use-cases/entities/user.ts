import { Storable, Store } from './store'

export interface UserStore extends Store<IUser> {}

interface ProvdierDataTelegram {
    username?: string
    chatId: string
    locale?: string
}

interface ProviderData {
    telegram: ProvdierDataTelegram | null
}

export interface IUser {
    id: string | null
    name: string
    provider: ProviderData
}

export class User implements IUser {
    public id: string | null
    public name: string
    public provider: ProviderData
    constructor(params: Pick<IUser, 'name'> & Partial<IUser & Storable>) {
        this.id = params.id || null
        this.name = params.name
        this.provider = {
            telegram: params.provider?.telegram || null,
        }
    }
}
