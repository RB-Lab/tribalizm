import { isCoordinationQuest } from './entities/quest'
import { Storable } from './entities/store'
import { ContextUser } from './utils/context-user'
import { findMaxTrait } from './utils/members-utils'
import { Message } from './utils/message'
import { HowWasGatheringTask } from './utils/scheduler'

export class GatheringFinale extends ContextUser {
    async notifyMembers(notifyTask: Storable & HowWasGatheringTask) {
        const gathering = await this.getGathering(
            notifyTask.payload.gatheringId
        )
        const members = await this.stores.memberStore.find({
            id: gathering.accepted,
        })
        for (let m of members) {
            this.notify<HowWasGatheringMessage>({
                type: 'how-was-gathering-message',
                payload: {
                    gatheringId: gathering.id,
                    gatheringName: gathering.description,
                    targetUserId: m.userId,
                },
            })
        }
        this.scheduler.markDone(notifyTask.id)
    }
    finalize = async (req: FinalizeGatheringRequest) => {
        const gathering = await this.getGathering(req.gatheringId)
        const member = await this.getTribeMemberByUserId(
            gathering.tribeId,
            req.userId
        )
        gathering.imDone(member.id)
        const coordinators = new Set<string>()
        const addCoordinators = async (parentQuestId: string | null) => {
            if (parentQuestId) {
                const quest = await this.getQuest(parentQuestId)
                if (!isCoordinationQuest(quest)) {
                    throw new Error(
                        `Cannot re-spawn non-coordination quest ${quest.id} (${quest.type})`
                    )
                }
                quest.memberIds.forEach((id) => coordinators.add(id))
                await addCoordinators(quest.parentQuestId)
            }
        }
        await addCoordinators(gathering.parentQuestId)
        const members = await this.stores.memberStore.find({
            id: [...coordinators],
        })
        members.forEach((m) => {
            if (m.id !== member.id) {
                m.castVote({
                    type: 'gathering-vote',
                    casted: Date.now(),
                    gatheringId: gathering.id,
                    memberId: member.id,
                    score: req.score,
                })
            }
        })
        await this.stores.memberStore.saveBulk(members)
        const tribeMembers = await this.stores.memberStore.find({
            tribeId: gathering.tribeId,
        })
        const mostCharismatic = findMaxTrait(tribeMembers, 'charisma')
        const mostWise = findMaxTrait(tribeMembers, 'wisdom')
        const tribe = await this.getTribe(gathering.tribeId)
        await this.stores.tribeStore.save({
            ...tribe,
            chiefId: mostCharismatic.id,
            shamanId: mostWise.id,
        })
        await this.stores.gatheringStore.save(gathering)
    }
}

interface FinalizeGatheringRequest {
    userId: string
    gatheringId: string
    score: number
}

export interface HowWasGatheringMessage extends Message {
    type: 'how-was-gathering-message'
    payload: {
        targetUserId: string
        gatheringId: string
        gatheringName: string
    }
}
