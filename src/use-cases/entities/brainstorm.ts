export interface IdeasStore {
    getById: (ideaId: string) => Promise<QuestIdea | null>
    save: <T extends QuestIdea | QuestIdea[]>(idea: T) => Promise<T>
    find: (params: { brainstormId?: string }) => Promise<QuestIdea[]>
}

export interface BrainstormStore {
    getById: (id: string) => Promise<Brainstorm | null>
    save: (brainsorm: Brainstorm) => Promise<Brainstorm>
}

export type BrainStormState = 'initiated' | 'generation' | 'voting' | 'finished'

export class Brainstorm {
    private _id: string
    get id() {
        return this._id
    }
    private _tribeId: string
    get tribeId() {
        return this._tribeId
    }
    private _state: BrainStormState
    get state() {
        return this._state
    }
    private _date: Date
    get date() {
        return this._date
    }
    constructor(
        id: string,
        tribeId: string,
        state: BrainStormState = 'initiated',
        date: Date = new Date()
    ) {
        this._id = id
        this._tribeId = tribeId
        this._state = state
        this._date = date
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

type IdeaState = 'new' | 'finished'
export class QuestIdea {
    private _id: string
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
        id: string
        description: string
        meberId: string
        brainstormId: string
        state?: IdeaState
        votes?: BrainstromVote[]
    }) {
        this._id = params.id
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
        this._votes.push({ vote: 'up', memberId })
    }
    voteDown = (memberId: string) => {
        this.checkCanVote(memberId)
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
export class UpdateFinishedIdeaError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export interface BrainstromVote {
    vote: 'up' | 'down'
    memberId: string
}
