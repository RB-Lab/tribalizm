import { ContextUser } from './utils/context-user'
import { Gathering, GatheringType } from './entities/gathering'
import { getRootIdea } from './utils/get-root-idea'
import { Message } from './utils/message'
import { HowWasGatheringTask } from './utils/scheduler'
import { QuestStatus } from './entities/quest'
import { QuestFinishedError } from './utils/errors'

export class GatheringDeclare extends ContextUser {
    declare = async (req: DeclarationRequest) => {
        const member = await this.getMember(req.memberId)
        const parentQuest = await this.getQuest(req.parentQuestId)

        if (parentQuest.status === QuestStatus.done) {
            throw new QuestFinishedError(
                `Cannot re-quest a finished quest ${parentQuest.status}`
            )
        }
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

        const targetMembersIds = await this.getTargetMembers(req)
        const targetMembers = await this.stores.memberStore.find({
            id: targetMembersIds,
        })
        targetMembers.forEach((targetMember) => {
            this.notify<GatheringMessage>({
                type: 'new-gathering-message',
                payload: {
                    description: gathering.description,
                    place: gathering.place,
                    time: gathering.time,
                    gatheringId: gathering.id,
                    targetMemberId: targetMember.id,
                    targetUserId: targetMember.userId,
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
            ).map((m) => m.id)
        }

        const ideaId = await getRootIdea(
            this.stores.questStore,
            req.parentQuestId
        )
        const idea = await this.getIdea(ideaId)
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        return [...upvoterIds, idea.memberId]
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
        targetUserId: string
        gatheringId: string
        description: string
        time: number
        place: string
    }
}
