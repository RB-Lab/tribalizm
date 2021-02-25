import { Context } from './context'
import { BrainstormStore, IdeaStore } from './entities/brainstorm'
import { MemberStore } from './entities/member'
import { EntityNotFound } from './not-found-error'

export class Voting {
    private _ideasStore: IdeaStore
    private _brainstormStore: BrainstormStore
    private _memberStore: MemberStore

    constructor(context: Context) {
        this._ideasStore = context.stores.ideaStore
        this._memberStore = context.stores.memberStore
        this._brainstormStore = context.stores.brainstormStore
    }

    start = async (brainsormId: string) => {
        const brainstorm = await this.getBrainstorm(brainsormId)
        if (brainstorm.state === 'voting') {
            return
        }
        brainstorm.toVoting()
        await this._brainstormStore.save(brainstorm)
    }

    private checkVotingAllowed = async (ideaId: string, memberId: string) => {
        const idea = await this.getIdea(ideaId)
        const brainstorm = await this.getBrainstorm(idea.brainstormId)
        if (brainstorm.state !== 'voting') {
            throw new VotingNotStartedError(
                "Cannot vote when voting hasn't beens started"
            )
        }
        const member = await this.getMember(memberId)
        if (member.tribeId !== brainstorm.tribeId) {
            throw new ExternalMemberVoteError(
                `Member of tribe ${member.tribeId} cannot vote for brainstorm of tribe ${brainstorm.tribeId}`
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

    private async getMember(memberId: string) {
        const member = await this._memberStore.getById(memberId)
        if (!member) {
            throw new EntityNotFound(`Member ${memberId} not found`)
        }
        return member
    }

    private async getIdea(ideaId: string) {
        const idea = await this._ideasStore.getById(ideaId)
        if (!idea) {
            throw new EntityNotFound(`Idea ${ideaId} not found`)
        }
        return idea
    }

    private async getBrainstorm(brainsormId: string) {
        const brainstorm = await this._brainstormStore.getById(brainsormId)
        if (!brainstorm) {
            throw new EntityNotFound(`Brainstorm ${brainsormId} not found`)
        }
        return brainstorm
    }
}

export class VotingNotStartedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

export class ExternalMemberVoteError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
