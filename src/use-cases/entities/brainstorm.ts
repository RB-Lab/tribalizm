export interface IdeaStore {
    getById: (ideaId: string) => Promise<SavedQuestIdea | null>
    save: (idea: IQuestIdea) => Promise<SavedQuestIdea>
    saveBulk: (idea: IQuestIdea[]) => Promise<SavedQuestIdea[]>
    find: (params: { brainstormId?: string }) => Promise<SavedQuestIdea[]>
}

export interface BrainstormStore {
    getById: (id: string) => Promise<SavedBrainstorm | null>
    save: (brainsorm: IBrainstorm) => Promise<SavedBrainstorm>
}

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
    private _id: string | null
    get id() {
        return this._id
    }
    private _tribeId: string
    get tribeId() {
        return this._tribeId
    }
    private _state: BrainstormState
    get state() {
        return this._state
    }
    private _date: number
    get date() {
        return this._date
    }
    constructor(params: {
        id?: string
        tribeId: string
        state?: BrainstormState
        date?: number
    }) {
        this._id = params.id || null
        this._tribeId = params.tribeId
        this._state = params.state || 'initiated'
        this._date = params.date || Date.now()
    }

    toVoting = () => {
        if (this.state === 'finished') {
            throw new UpdateFinishedBrainstormError(
                `Cannot update brainstrom ${this.id}: it is already finished`
            )
        }
        this._state = 'voting'
    }
    finish = () => {
        this._state = 'finished'
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
    private _id: string | null
    get id() {
        return this._id
    }
    private _description: string
    get description() {
        return this._description
    }
    private _meberId: string
    get meberId() {
        return this._meberId
    }
    private _brainstormId: string
    get brainstormId() {
        return this._brainstormId
    }
    private _state: IdeaState
    get state() {
        return this._state
    }
    private _votes: BrainstromVote[]
    get votes() {
        return this._votes
    }
    constructor(params: {
        id?: string
        description: string
        meberId: string
        brainstormId: string
        state?: IdeaState
        votes?: BrainstromVote[]
    }) {
        this._id = params.id || null
        this._meberId = params.meberId
        this._brainstormId = params.brainstormId
        this._description = params.description
        this._state = params.state || 'new'
        this._votes = params.votes || []
    }
    finish = () => {
        this._state = 'finished'
    }
    private checkCanVote(memberId: string) {
        if (this._meberId === memberId) {
            throw new SelfVotingError(
                `Voting for own ideas is not allowed. 
                Idea: ${this.id}, member: ${this._meberId}`
            )
        }
        if (this._state === 'finished') {
            throw new UpdateFinishedIdeaError(
                `Cannot vote for finished idea; idea id: ${this.id}`
            )
        }
    }
    voteUp = (memberId: string) => {
        this.checkCanVote(memberId)
        const thisVote = this.votes.find(
            (v) => v.memberId === memberId && v.vote === 'up'
        )
        if (thisVote) {
            throw new DoubelVotingError('Cannot vote twice')
        }
        this._votes.push({ vote: 'up', memberId })
    }
    voteDown = (memberId: string) => {
        this.checkCanVote(memberId)
        const thisVote = this.votes.find(
            (v) => v.memberId === memberId && v.vote === 'down'
        )
        if (thisVote) {
            throw new DoubelVotingError('Cannot vote twice')
        }
        this._votes.push({ vote: 'down', memberId })
    }
    getScore = () => {
        const downVotes = this.votes.filter((v) => v.vote === 'down').length
        const upVotes = this.votes.length - downVotes
        return upVotes - downVotes
    }
}

export class SelfVotingError extends Error {
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
