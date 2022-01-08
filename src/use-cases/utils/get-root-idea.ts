import { isCoordinationQuest, QuestStore } from '../entities/quest'
import { EntityNotFound } from './errors'

export async function getRootIdea(questStore: QuestStore, questId: string) {
    let rootQuest = await getQuest(questStore, questId)
    while (rootQuest.parentQuestId) {
        rootQuest = await getQuest(questStore, rootQuest.parentQuestId)
    }
    if (!rootQuest.ideaId) {
        throw new NoIdeaError(
            `Root quest (${rootQuest.id}) for quest ${questId} has no idea attached`
        )
    }
    return rootQuest.ideaId
}

async function getQuest(questStore: QuestStore, questId: string) {
    let quest = await questStore.getById(questId)
    if (!quest) {
        throw new EntityNotFound(`Quest ${questId} not found.`)
    }
    if (!isCoordinationQuest(quest)) {
        throw new Error(`Not a coordination quest ${quest.id} (${quest.id})`)
    }
    return quest
}

export class NoIdeaError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
