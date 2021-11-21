import {
    BrainstormStore,
    IBrainstorm,
    Brainstorm,
} from '../../../use-cases/entities/brainstorm'
import { MongoStore } from './mongo-store'

export class MongoBrainstormStore
    extends MongoStore<IBrainstorm>
    implements BrainstormStore
{
    _class = Brainstorm
}
