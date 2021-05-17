import { ITribe, TribeStore } from '../../../use-cases/entities/tribe'
import { InMemoryStore } from './in-memory-store'

export class InMemoryTribeStore extends InMemoryStore<ITribe>
    implements TribeStore {}
