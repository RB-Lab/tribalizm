import { ContextUser } from './context-user'
import { Gathering, GatheringType } from './entities/gathering'
import { Message } from './message'
import { NoIdeaError } from './no-idea-error'

export class GatheringDeclare extends ContextUser {
    declare = async (req: DeclarationRequest) => {
        const member = await this.getMember(req.memberId)
        const gathering = await this.context.stores.gatheringStore.save(
            new Gathering({
                type: req.type,
                tribeId: member.tribeId,
                description: req.description,
                place: req.place,
                time: req.time,
            })
        )

        const targetMembers = await this.getTargetMembers(req)
        targetMembers.forEach((targetMember) => {
            this.notify<GatheringMessage>({
                type: 'new-gathering-message',
                payload: {
                    ...gathering,
                    gatheringId: gathering.id,
                    targetMemberId: targetMember,
                },
            })
        })
    }

    private getTargetMembers = async (req: DeclarationRequest) => {
        const member = await this.getMember(req.memberId)
        if (req.type === 'all') {
            return (
                await this.context.stores.memberStore.find({
                    tribeId: member.tribeId,
                })
            )
                .filter((m) => m.id !== req.memberId)
                .map((m) => m.id)
        }

        const parentQuest = await this.getQuest(req.parentQuestId)
        let rootQuest = parentQuest
        while (rootQuest.parentQuestId) {
            rootQuest = await this.getQuest(rootQuest.parentQuestId)
        }
        if (!rootQuest.ideaId) {
            throw new NoIdeaError(
                `Root quest (${rootQuest.id}) for quest ${parentQuest.id} has no idea attached`
            )
        }

        const idea = await this.getIdea(rootQuest.ideaId)
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        return [...upvoterIds, idea.meberId].filter(
            (mid) => mid !== req.memberId
        )
    }
}

interface DeclarationRequest {
    memberId: string
    type: GatheringType
    parentQuestId: string
    description: string
    time: number
    place: string
}

export interface GatheringMessage extends Message {
    type: 'new-gathering-message'
    payload: {
        targetMemberId: string
        gatheringId: string
        description: string
        time: number
        place: string
    }
}
