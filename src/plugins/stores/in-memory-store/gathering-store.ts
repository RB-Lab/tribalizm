import {
    Gathering,
    IGathering,
    GatheringStore,
} from '../../../use-cases/entities/gathering'
import { InMemoryStore } from './in-memory-store'

export class InMemoryGatheringStore
    extends InMemoryStore<IGathering>
    implements GatheringStore
{
    _class = Gathering
}
