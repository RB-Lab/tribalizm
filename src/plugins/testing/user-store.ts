import { IUser, UserStore } from '../../use-cases/entities/user'
import { InMemoryStore } from './in-memory-store'

export class InMemoryUserStore extends InMemoryStore<IUser>
    implements UserStore {}
