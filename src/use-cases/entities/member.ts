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
        if (vote.memberId === this.id) {
            return
        }
        this.votes.push(vote)
        if (vote.type === 'gathering-vote') {
            if (vote.score < 0 || vote.score > 4) {
                throw new OutOfRange(
                    `Cannot set scroe ${vote.score}: must be between 0 and 4`
                )
            }
            this.recaluclateScores()
        }
    }

    private recaluclateScores = () => {
        const gatheringVotes: Record<string, number[]> = {}
        this.votes.forEach((vote) => {
            if (vote.type === 'gathering-vote') {
                const scores = gatheringVotes[vote.gatheringId] || []
                gatheringVotes[vote.gatheringId] = [...scores, vote.score]
            }
        })
        this.charisma = 0
        this.wisdom = 0
        Object.values(gatheringVotes).forEach((scores) => {
            const meanScore = mean(scores)
            this.charisma += meanScore / 2
            this.wisdom += meanScore / 2
        })
    }
}
export type MemberVote = QuestVote | GatheringVote

export interface QuestVote {
    type: 'quest-vote'
    /** Member who voted */
    memberId: string
    /** Quest that was the reason for voting */
    questId: string
    charisma: number
    wisdom: number
    /** Timestamp of voting moment */
    casted: number
}
export interface GatheringVote {
    type: 'gathering-vote'
    /** Member who voted */
    memberId: string
    /** Gethernin that was the reason for voting */
    gatheringId: string
    score: number
    /** Timestamp of voting moment */
    casted: number
}

export class OutOfRange extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

function mean(ns: number[]) {
    return ns.reduce((s, n) => s + n, 0) / ns.length
}
