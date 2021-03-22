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
                    description: req.description,
                    targetMemberId: m.id,
                },
            })
        })

        return idea
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
        targetMemberId: string
        description: string
    }
}
