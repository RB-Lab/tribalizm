import { ContextUser } from './context-user'
import { SavedQuestIdea } from './entities/brainstorm'
import { NotYourQuest, Quest } from './entities/quest'
import { getBestFreeMember } from './get-best-free-member'
import { NoIdeaError } from './no-idea-error'
import { QuestMessage } from './quest-message'

export class QuestSource extends ContextUser {
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
        await this.context.stores.questStore.save(quest)
    }
    spawnQuest = async (req: SpawnRequest) => {
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
        const oneWeekAhead = Date.now() + 7 * 24 * 3_600_000

        const idea = await this.getIdea(rootQuest.ideaId)

        const memberIds = await this.getQuestAssignees(
            idea,
            parentQuest.memberIds
        )

        const quest = await this.context.stores.questStore.save(
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
                    targetMemberId,
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
                `There is not enough members who liked idea ${idea.id}: ${memberIds} (2 min)`
            )
        }
        const members = await this.context.stores.memberStore.find({
            id: memberIds,
        })
        const activeQuests = await this.context.stores.questStore.getActiveQuestsCount(
            memberIds
        )
        const exclude = members.length < 4 ? [] : origMemberIds
        const first = getBestFreeMember(
            members,
            'charisma',
            activeQuests,
            exclude
        )
        exclude.push(first.id)
        const second = getBestFreeMember(
            members,
            first.charisma > first.wisdom ? 'wisdom' : 'charisma',
            activeQuests,
            exclude
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
