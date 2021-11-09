import { Storable, Store } from './store'

export interface UserStore extends Store<IUser> {}

export interface ProvdierDataTelegram {
    chatId: string
    username?: string
    locale?: string
}

interface ProviderData {
    // TODO this must be defined in TelgramAdapter...
    telegram: ProvdierDataTelegram | null
}

export interface IUser {
    id: string | null
    name: string
    provider: ProviderData
}
export type StoredUser = IUser & Storable

export class User implements IUser {
    public id: string | null
    public name: string
    public provider: ProviderData
    constructor(params: Pick<IUser, 'name'> & Partial<StoredUser>) {
        this.id = params.id || null
        this.name = params.name
        this.provider = {
            telegram: params.provider?.telegram || null,
        }
    }
}
