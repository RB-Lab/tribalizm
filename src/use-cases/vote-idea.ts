import { Context } from './context'
import {
    Brainstorm,
    BrainstormStore,
    IdeaStore,
    SavedBrainstorm,
} from './entities/brainstorm'
import { MemberStore } from './entities/member'
import { EntityNotFound } from './not-found-error'

export class Voting {
    private _ideasStore: IdeaStore
    private _brainstormStore: BrainstormStore
    private _memberStore: MemberStore
    // TODO remove this state
    private _brainstorm: SavedBrainstorm | null = null

    constructor(context: Context) {
        this._ideasStore = context.stores.ideasStore
        this._memberStore = context.stores.memberStore
        this._brainstormStore = context.stores.brainstormStore
    }

    start = async (brainsormId: string) => {
        this._brainstorm = await this._brainstormStore.getById(brainsormId)
        if (!this._brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainsormId} not found`)
        }
        if (this._brainstorm.state === 'voting') {
            return
        }
        this._brainstorm.toVoting()
        await this._brainstormStore.save(this._brainstorm)
    }

    private checkVotingAllowed = async (ideaId: string, memberId: string) => {
        const idea = await this._ideasStore.getById(ideaId)
        if (!idea) {
            throw new EntityNotFound(`Idea ${ideaId} not found`)
        }
        if (!this._brainstorm) {
            throw new VotingNotStartedError(
                "Cannot vote when voting hasn't beens started"
            )
        }
        if (idea.brainstormId !== this._brainstorm.id) {
            throw new StormMismatchError(
                `Cannot vote idea from strom ${idea.brainstormId} in storm ${this._brainstorm.id}`
            )
        }
        const member = await this._memberStore.getById(memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${memberId} not found`)
        }
        if (member.tribeId !== this._brainstorm.tribeId) {
            throw new ExternalMemberVoteError(
                `Member of tribe ${member.tribeId} cannot vote for brainstorm of tribe ${this._brainstorm.tribeId}`
            )
        }
        return idea
    }
    voteUp = async (ideaId: string, memberId: string) => {
        const idea = await this.checkVotingAllowed(ideaId, memberId)
        idea.voteUp(memberId)
        this._ideasStore.save(idea)
    }

    voteDown = async (ideaId: string, memberId: string) => {
        const idea = await this.checkVotingAllowed(ideaId, memberId)
        idea.voteDown(memberId)
        this._ideasStore.save(idea)
    }
}

export class VotingNotStartedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class StormMismatchError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class ExternalMemberVoteError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
