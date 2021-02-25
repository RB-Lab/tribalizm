import { Store } from './store'

export interface IdeaStore extends Store<IQuestIdea> {}

export interface BrainstormStore extends Store<IBrainstorm> {}

export type BrainstormState = 'initiated' | 'generation' | 'voting' | 'finished'

export interface IBrainstorm {
    id: string | null
    tribeId: string
    state: BrainstormState
    date: number
    toVoting: () => void
    finish: () => void
}
export interface SavedBrainstorm extends IBrainstorm {
    id: string
}
export class Brainstorm implements IBrainstorm {
    public id: string | null
    public tribeId: string
    public state: BrainstormState
    public date: number
    constructor(params: {
        id?: string
        tribeId: string
        state?: BrainstormState
        date?: number
    }) {
        this.id = params.id || null
        this.tribeId = params.tribeId
        this.state = params.state || 'initiated'
        this.date = params.date || Date.now()
    }

    toVoting = () => {
        if (this.state === 'finished') {
            throw new UpdateFinishedBrainstormError(
                `Cannot update brainstrom ${this.id}: it is already finished`
            )
        }
        this.state = 'voting'
    }
    finish = () => {
        this.state = 'finished'
    }
}
export class UpdateFinishedBrainstormError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export interface IQuestIdea {
    id: string | null
    description: string
    meberId: string
    brainstormId: string
    state: IdeaState
    votes: BrainstromVote[]
    voteUp: (memberId: string) => void
    voteDown: (memberId: string) => void
    getScore: () => number
    finish: () => void
}
export interface SavedQuestIdea extends IQuestIdea {
    id: string
}

type IdeaState = 'new' | 'finished'
export class QuestIdea implements IQuestIdea {
    public id: string | null
    public description: string
    public meberId: string
    public brainstormId: string
    public state: IdeaState
    public votes: BrainstromVote[]
    constructor(params: {
        id?: string
        description: string
        meberId: string
        brainstormId: string
        state?: IdeaState
        votes?: BrainstromVote[]
    }) {
        this.id = params.id || null
        this.meberId = params.meberId
        this.brainstormId = params.brainstormId
        this.description = params.description
        this.state = params.state || 'new'
        this.votes = params.votes || []
    }
    finish = () => {
        this.state = 'finished'
    }
    voteUp = (memberId: string) => {
        this.checkCanVote(memberId)
        this.vote(memberId, 'up')
    }
    voteDown = (memberId: string) => {
        this.checkCanVote(memberId)
        this.vote(memberId, 'down')
    }
    getScore = () => {
        const downVotes = this.votes.filter((v) => v.vote === 'down').length
        const upVotes = this.votes.length - downVotes
        return upVotes - downVotes
    }
    private vote = (memberId: string, vote: 'up' | 'down') => {
        const currentMemberVote = this.votes.find(
            (v) => v.memberId === memberId
        )
        if (currentMemberVote) {
            if (currentMemberVote.vote === vote) {
                throw new DoubelVotingError('Cannot vote twice')
            }
            currentMemberVote.vote = vote
            return
        }
        this.votes.push({ vote, memberId })
    }
    private checkCanVote(memberId: string) {
        if (this.meberId === memberId) {
            throw new SelfVotingIdeaError(
                `Voting for own ideas is not allowed. 
                Idea: ${this.id}, member: ${this.meberId}`
            )
        }
        if (this.state === 'finished') {
            throw new UpdateFinishedIdeaError(
                `Cannot vote for finished idea; idea id: ${this.id}`
            )
        }
    }
}

export class SelfVotingIdeaError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class DoubelVotingError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class UpdateFinishedIdeaError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export interface BrainstromVote {
    vote: 'up' | 'down'
    memberId: string
}
