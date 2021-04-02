import { ContextUser } from './utils/context-user'
import { Gathering, GatheringType } from './entities/gathering'
import { getRootIdea } from './utils/get-root-idea'
import { Message } from './utils/message'
import { HowWasGatheringTask } from './utils/scheduler'

export class GatheringDeclare extends ContextUser {
    declare = async (req: DeclarationRequest) => {
        const member = await this.getMember(req.memberId)
        // just to check that quests exists
        const parentQuest = await this.getQuest(req.parentQuestId)
        const gathering = await this.stores.gatheringStore.save(
            new Gathering({
                type: req.type,
                parentQuestId: parentQuest.id,
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
        const taskDate = new Date(gathering.time + 24 * 3_600_000)
        taskDate.setHours(10)
        this.scheduler.schedule<HowWasGatheringTask>({
            type: 'how-was-gathering',
            done: false,
            time: taskDate.getTime(),
            payload: {
                gatheringId: gathering.id,
            },
        })
    }

    private getTargetMembers = async (req: DeclarationRequest) => {
        const member = await this.getMember(req.memberId)
        if (req.type === 'all') {
            return (
                await this.stores.memberStore.find({
                    tribeId: member.tribeId,
                })
            )
                .filter((m) => m.id !== req.memberId)
                .map((m) => m.id)
        }

        const ideaId = await getRootIdea(
            this.stores.questStore,
            req.parentQuestId
        )
        const idea = await this.getIdea(ideaId)
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
