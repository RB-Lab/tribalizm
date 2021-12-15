import { Storable, Store } from './store'

export interface MemberStore extends Store<IMember> {
    countTribeMembers(memberId: string): Promise<number>
    countTribeMembers(memberIds: string[]): Promise<Record<string, number>>
}

export interface IMemberData {
    id: string | null
    userId: string
    tribeId: string
    charisma: number
    wisdom: number
    isCandidate: boolean
    votes: MemberVote[]
}

export interface IMember extends IMemberData {
    castVote: (vote: MemberVote) => void
}
export type SavedMember = IMember & Storable

export class Member implements IMember {
    public id: string | null
    public userId: string
    public tribeId: string
    public charisma: number
    public wisdom: number
    public isCandidate: boolean
    public votes: MemberVote[]
    constructor(
        params: Partial<IMemberData & Storable> &
            Pick<IMember, 'userId' | 'tribeId'>
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
            throw new SelfVotingError(`Cannot vote for self (id: ${this.id})`)
        }
        if (vote.type === 'gathering-vote') {
            if (vote.score < 0 || vote.score > 4) {
                throw new VoteRangeError(
                    `Cannot set score ${vote.score}: must be between 0 and 4`
                )
            }
        } else if (vote.type === 'quest-vote') {
            // TODO make it 0-4
            if (vote.charisma > 9 || vote.charisma < 0) {
                throw new VoteRangeError(
                    `Cannot set charisma to ${vote.charisma}: must be between 0 and 9`
                )
            }
            if (vote.wisdom > 9 || vote.wisdom < 0) {
                throw new VoteRangeError(
                    `Cannot set wisdom to ${vote.wisdom}: must be between 0 and 9`
                )
            }
        }
        this.votes.push(vote)
        this.recalculateGatheringScores()
    }

    private recalculateGatheringScores = () => {
        const gatheringVotes: Record<string, number[]> = {}
        const memberVotes: Record<string, { c: number[]; w: number[] }> = {}
        let buffer: Record<string, { c: number[]; w: number[] }> = {}
        this.votes.forEach((vote) => {
            if (vote.type === 'gathering-vote') {
                const scores = gatheringVotes[vote.gatheringId] || []
                gatheringVotes[vote.gatheringId] = [...scores, vote.score]
            }
            if (vote.type === 'quest-vote') {
                if (!buffer[vote.memberId]) {
                    buffer[vote.memberId] = { c: [], w: [] }
                }
                const cScores = buffer[vote.memberId].c
                const wScores = buffer[vote.memberId].w
                buffer[vote.memberId].c = [...cScores, vote.charisma]
                buffer[vote.memberId].w = [...wScores, vote.wisdom]
                const bufferLen = Object.values(buffer).reduce(
                    (s, v) => (s += Math.min(v.c.length, v.w.length)),
                    0
                )
                if (bufferLen >= 5) {
                    Object.entries(buffer).forEach(([id, scores]) => {
                        if (!memberVotes[id]) {
                            memberVotes[id] = { c: [], w: [] }
                        }
                        memberVotes[id].c = [...memberVotes[id].c, ...scores.c]
                        memberVotes[id].w = [...memberVotes[id].w, ...scores.w]
                    })
                    buffer = {}
                }
            }
        })
        this.charisma = 0
        this.wisdom = 0
        Object.values(gatheringVotes).forEach((scores) => {
            const meanScore = mean(scores)
            this.charisma += meanScore / 2
            this.wisdom += meanScore / 2
        })
        Object.values(memberVotes).forEach((scores) => {
            const meanCScore = mean(scores.c)
            const meanWScore = mean(scores.w)
            this.charisma += meanCScore
            this.wisdom += meanWScore
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
    /** Gathering that was the reason for voting */
    gatheringId: string
    score: number
    /** Timestamp of voting moment */
    casted: number
}

export class VoteRangeError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export class SelfVotingError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

function mean(ns: number[]) {
    return ns.reduce((s, n) => s + n, 0) / ns.length
}
