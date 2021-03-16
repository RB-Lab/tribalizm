import { QuestStore } from '../entities/quest'
import { EntityNotFound } from './not-found-error'

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
    return quest
}

export class NoIdeaError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
