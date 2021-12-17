import {
    Member,
    IMember,
    MemberStore,
} from '../../../use-cases/entities/member'
import { MongoStore } from './mongo-store'

export class MongoMemberStore
    extends MongoStore<IMember>
    implements MemberStore
{
    _class = Member
    countTribeMembers(ids: string): Promise<number>
    countTribeMembers(ids: string[]): Promise<Record<string, number>>
    countTribeMembers(ids: string | string[]) {
        if (Array.isArray(ids)) {
            return this.getMembersCountByTribe(ids)
        }
        return this.getTribeMembersCount(ids)
    }

    private getMembersCountByTribe = async (ids: string[]) => {
        const result: Record<string, number> = {}
        for (let id of ids) {
            result[id] = await this.getTribeMembersCount(id)
        }

        return result
    }
    private getTribeMembersCount = async (tribeId: string) => {
        const t = await this.findSimple({ tribeId })
        return t.length
    }
}
