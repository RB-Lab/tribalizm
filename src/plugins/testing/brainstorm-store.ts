import {
    BrainstormStore,
    IBrainstorm,
} from '../../use-cases/entities/brainstorm'
import { InMemoryStore } from './in-memory-store'

export class InMemoryBrainstormStore extends InMemoryStore<IBrainstorm>
    implements BrainstormStore {}
