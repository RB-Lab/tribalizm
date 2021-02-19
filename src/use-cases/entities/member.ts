export interface MemberStore {
    find: (params: {
        tribeId?: string | string[]
        id?: string | string[]
        userId?: string | string[]
    }) => Promise<SavedMember[]>
    getById: (id: string) => Promise<SavedMember | null>
    save: (member: IMember) => Promise<SavedMember>
    saveBulk: (member: IMember[]) => Promise<SavedMember[]>
}

export interface IMember {
    id: string | null
    userId: string
    tribeId: string
    charisma: number
    wisdom: number
    isCandidate: boolean
    votes: MemberVote[]
    castVote: (vote: MemberVote) => void
}
export interface SavedMember extends IMember {
    id: string
}

export class Member implements IMember {
    public id: string | null
    public userId: string
    public tribeId: string
    public charisma: number
    public wisdom: number
    public isCandidate: boolean
    public votes: MemberVote[]
    constructor(
        params: Partial<SavedMember> & Pick<IMember, 'userId' | 'tribeId'>
    ) {
        this.id = params.id || null
        this.userId = params.userId
        this.tribeId = params.tribeId
        this.charisma = params.charisma || 0
        this.wisdom = params.wisdom || 0
        this.votes = params.votes || []
        this.isCandidate =
            params.isCandidate === undefined ? true : params.isCandidate
    }

    castVote = (vote: MemberVote) => {
        this.votes.push(vote)
    }
}

export interface MemberVote {
    /** Member who voted */
    memberId: string
    /** Quest that was the reason for voting */
    questId: string
    charisma: number
    wisdom: number
    /** Timestamp of voting moment */
    casted: number
}
