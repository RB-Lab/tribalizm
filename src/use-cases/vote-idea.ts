import { ContextUser } from './utils/context-user'

export class Voting extends ContextUser {
    start = async (brainsormId: string) => {
        const brainstorm = await this.getBrainstorm(brainsormId)
        if (brainstorm.state === 'voting') {
            return
        }
        brainstorm.toVoting()
        await this.stores.brainstormStore.save(brainstorm)
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
        this.stores.ideaStore.save(idea)
    }

    voteDown = async (ideaId: string, memberId: string) => {
        const idea = await this.checkVotingAllowed(ideaId, memberId)
        idea.voteDown(memberId)
        this.stores.ideaStore.save(idea)
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
