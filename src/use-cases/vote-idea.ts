import { Brainstorm, BrainstormStore, IdeasStore } from './entities/brainstorm'
import { MembersStore } from './entities/member'
import { EntityNotFound } from './entities/not-found-error'

export class Voting {
    private _ideasStore: IdeasStore
    private _brainstormStore: BrainstormStore
    private _memberStore: MembersStore
    private _brainstorm: Brainstorm | null = null

    constructor(
        ideasStore: IdeasStore,
        brainstormStore: BrainstormStore,
        memberStroe: MembersStore
    ) {
        this._ideasStore = ideasStore
        this._memberStore = memberStroe
        this._brainstormStore = brainstormStore
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
