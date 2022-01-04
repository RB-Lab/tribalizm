import { ContextUser } from './utils/context-user'

export class Voting extends ContextUser {
    private checkVotingAllowed = async (ideaId: string, userId: string) => {
        const idea = await this.getIdea(ideaId)
        const brainstorm = await this.getBrainstorm(idea.brainstormId)
        const member = await this.getTribeMemberByUserId(
            brainstorm.tribeId,
            userId
        )
        if (brainstorm.state === 'finished') {
            throw new BrainstormEndedError(
                `Cannot vote for idea from ${brainstorm.id}, it is already finished`
            )
        }
        if (brainstorm.state !== 'voting') {
            throw new VotingNotStartedError(
                "Cannot vote when voting hasn't been started"
            )
        }
        if (member.tribeId !== brainstorm.tribeId) {
            throw new ExternalMemberVoteError(
                `Member of tribe ${member.tribeId} cannot vote for brainstorm of tribe ${brainstorm.tribeId}`
            )
        }
        return { idea, member }
    }
    voteUp = async (ideaId: string, userId: string) => {
        const { idea, member } = await this.checkVotingAllowed(ideaId, userId)
        idea.voteUp(member.id)
        await this.stores.ideaStore.save(idea)
    }

    voteDown = async (ideaId: string, userId: string) => {
        const { idea, member } = await this.checkVotingAllowed(ideaId, userId)
        idea.voteDown(member.id)
        await this.stores.ideaStore.save(idea)
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

export class BrainstormEndedError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
