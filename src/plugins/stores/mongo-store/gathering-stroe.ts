import {
    IGathering,
    Gathering,
    GatheringStore,
} from '../../../use-cases/entities/gathering'
import { MongoStore } from './mongo-store'

export class MongoGatheringStore
    extends MongoStore<IGathering>
    implements GatheringStore
{
    _class = Gathering
}
