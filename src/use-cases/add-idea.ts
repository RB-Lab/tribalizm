import { QuestIdea } from './entities/brainstorm'
import { ContextUser } from './utils/context-user'
import { Message } from './utils/message'
import { NotYourTribe } from './utils/not-your-tribe'

export class AddIdea extends ContextUser {
    addIdea = async (req: AddIdeaRequest) => {
        const member = await this.getMember(req.meberId)
        const members = await this.stores.memberStore.find({
            tribeId: member.tribeId,
        })
        const brainstorm = await this.getBrainstorm(req.brainstormId)
        if (member.tribeId !== brainstorm.tribeId) {
            throw new NotYourTribe(
                `brainstorm ${brainstorm.id} is gathered not for your tirbe`
            )
        }
        if (brainstorm.state !== 'generation') {
            throw new StormNotStarted(
                `Cannot add idea to ${brainstorm.id} storm: it is in ${brainstorm.state} phase`
            )
        }
        const idea = await this.stores.ideaStore.save(
            new QuestIdea({
                brainstormId: req.brainstormId,
                description: req.description,
                meberId: req.meberId,
            })
        )
        members.forEach((m) => {
            if (m.id === req.meberId) return
            if (m.isCandidate) return
            this.notify<NewIdeaMessage>({
                type: 'new-idea-added',
                payload: {
                    ideaId: idea.id,
                    brainstormId: brainstorm.id,
                    description: req.description,
                    targetMemberId: m.id,
                    targetUserId: m.userId,
                },
            })
        })
    }
}

export interface AddIdeaRequest {
    meberId: string
    brainstormId: string
    description: string
}

export interface NewIdeaMessage extends Message {
    type: 'new-idea-added'
    payload: {
        ideaId: string
        brainstormId: string
        targetUserId: string
        targetMemberId: string
        description: string
    }
}
export class StormNotStarted extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
