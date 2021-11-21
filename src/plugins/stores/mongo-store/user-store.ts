import { User, IUser, UserStore } from '../../../use-cases/entities/user'
import { MongoStore } from './mongo-store'

export class MongoUserStore extends MongoStore<IUser> implements UserStore {
    _class = User
}
