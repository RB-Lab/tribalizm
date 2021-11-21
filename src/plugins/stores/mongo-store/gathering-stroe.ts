import {
    IGathering,
    Gathering,
    GatheringtStore,
} from '../../../use-cases/entities/gathering'
import { MongoStore } from './mongo-store'

export class MongoGatheringStore
    extends MongoStore<IGathering>
    implements GatheringtStore
{
    _class = Gathering
}
