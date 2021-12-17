import { ContextUser } from './utils/context-user'
import { Gathering, GatheringType } from './entities/gathering'
import { getRootIdea } from './utils/get-root-idea'
import { Message } from './utils/message'
import { HowWasGatheringTask } from './utils/scheduler'
import { QuestStatus } from './entities/quest'
import { QuestFinishedError } from './utils/errors'
import { IMember } from './entities/member'

export class GatheringDeclare extends ContextUser {
    declare = async (req: DeclarationRequest) => {
        const parentQuest = await this.getQuest(req.parentQuestId)
        const parentQuestMember = await this.getMember(parentQuest.memberIds[0])

        const member = await this.getTribeMemberByUserId(
            parentQuestMember.tribeId,
            req.userId
        )

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

        const targetMembersIds = await this.getTargetMembers(
            req.type,
            member,
            req.parentQuestId
        )
        const targetMembers = await this.stores.memberStore.findSimple({
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

    private getTargetMembers = async (
        type: string,
        member: IMember,
        parentQuestId: string
    ) => {
        if (type === 'all') {
            return (
                await this.stores.memberStore.findSimple({
                    tribeId: member.tribeId,
                })
            ).map((m) => m.id)
        }

        const ideaId = await getRootIdea(this.stores.questStore, parentQuestId)
        const idea = await this.getIdea(ideaId)
        const upVoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        return [...upVoterIds, idea.memberId]
    }
}

interface DeclarationRequest {
    userId: string
    type: GatheringType
    parentQuestId: string
    description: string
    time: number
    place: string
}

export interface GatheringMessage extends Message {
    type: 'new-gathering-message'
    payload: {
        targetUserId: string
        gatheringId: string
        description: string
        time: number
        place: string
    }
}
