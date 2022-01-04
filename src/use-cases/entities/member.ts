import { Storable, Store } from '../utils/store'

export interface MemberStore extends Store<IMember> {
    countTribeMembers(memberId: string): Promise<number>
    countTribeMembers(memberIds: string[]): Promise<Record<string, number>>
}

export interface IMemberData {
    id: string | null
    userId: string
    tribeId: string
    isCandidate: boolean
}
// TODO MIGRATE: drop votes, charisma, wisdom

export interface IMember extends IMemberData {}
export type SavedMember = IMember & Storable

export class Member implements IMember {
    public id: string | null
    public userId: string
    public tribeId: string
    public isCandidate: boolean
    constructor(
        params: Partial<IMemberData & Storable> &
            Pick<IMember, 'userId' | 'tribeId'>
    ) {
        this.id = params.id || null
        this.userId = params.userId
        this.tribeId = params.tribeId
        this.isCandidate = params.isCandidate ?? true
    }
}
