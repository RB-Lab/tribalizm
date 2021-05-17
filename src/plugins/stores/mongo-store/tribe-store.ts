import { ITribe, TribeStore } from '../../../use-cases/entities/tribe'
import { MongoStore } from './mongo-store'

export class MongoTribeStore extends MongoStore<ITribe> implements TribeStore {}
