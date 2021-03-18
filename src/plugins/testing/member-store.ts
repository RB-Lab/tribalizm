import { IMember, MemberStore } from '../../use-cases/entities/member'
import { InMemoryStore } from './in-memory-store'

export class InMemoryMemberStore extends InMemoryStore<IMember>
    implements MemberStore {}
