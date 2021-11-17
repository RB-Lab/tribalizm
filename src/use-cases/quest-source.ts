import { SavedQuestIdea } from './entities/brainstorm'
import { NotYourQuest, Quest } from './entities/quest'
import { ContextUser } from './utils/context-user'
import { getBestFreeMember } from './utils/members-utils'
import { getRootIdea } from './utils/get-root-idea'
import { QuestMessage } from './utils/quest-message'

export class QuestSource extends ContextUser {
    /**
     * Creates a sub-quest _with the same line-up_. In case coordinators decided, that they need to
     * meet one more time
     */
    reQuest = async (req: ReQuestRequest) => {
        const parentQuest = await this.getQuest(req.parentQuestId)
        if (!parentQuest.memberIds.includes(req.memberId)) {
            throw new NotYourQuest(
                `Member ${req.memberId} is not assigned to quest ${parentQuest.id}`
            )
        }
        const quest = new Quest({
            time: req.time,
            place: req.place,
            description: req.description,
            memberIds: parentQuest.memberIds,
            parentQuestId: parentQuest.id,
        })
        await this.stores.questStore.save(quest)
    }
    /**
     * Creates a sub-quest.
     */
    spawnQuest = async (req: SpawnRequest) => {
        const parentQuest = await this.getQuest(req.parentQuestId)
        // TODO check member spawning member is one of the parent quest assignees
        // TODO check that parent quest is not in the future
        const ideaId = await getRootIdea(
            this.stores.questStore,
            req.parentQuestId
        )
        const idea = await this.getIdea(ideaId)
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000

        const memberIds = await this.getQuestAssignees(
            idea,
            parentQuest.memberIds
        )

        const quest = await this.stores.questStore.save(
            new Quest({
                time: oneWeekAhead,
                description: req.description,
                memberIds: memberIds,
                parentQuestId: parentQuest.id,
            })
        )
        quest.memberIds.forEach((targetMemberId) => {
            this.notify<QuestMessage>({
                type: 'new-quest-message',
                payload: {
                    ...quest,
                    questId: quest.id,
                    targetUserId: targetMemberId,
                },
            })
        })
        return quest
    }

    private getQuestAssignees = async (
        idea: SavedQuestIdea,
        origMemberIds: string[]
    ) => {
        const upvoterIds = idea.votes
            .filter((v) => v.vote === 'up')
            .map((v) => v.memberId)
        const memberIds = [...upvoterIds, idea.meberId]
        if (memberIds.length < 2) {
            throw new NotEnoughMembers(
                `There is not enough members who liked idea ${idea.id}: ${memberIds.length} (2 min)`
            )
        }
        const members = await this.stores.memberStore.find({
            id: memberIds,
        })
        const activeQuests = await this.stores.questStore.getActiveQuestsCount(
            memberIds
        )
        const exclude = members.length < 4 ? [] : origMemberIds
        const first = getBestFreeMember(
            members,
            'charisma',
            activeQuests,
            exclude
        )
        const second = getBestFreeMember(
            members,
            first.charisma > first.wisdom ? 'wisdom' : 'charisma',
            activeQuests,
            [...exclude, first.id]
        )
        return [first.id, second.id]
    }
}

interface SpawnRequest {
    memberId: string
    parentQuestId: string
    description: string
}
interface ReQuestRequest extends SpawnRequest {
    time: number
    place: string
}

export class NotEnoughMembers extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
