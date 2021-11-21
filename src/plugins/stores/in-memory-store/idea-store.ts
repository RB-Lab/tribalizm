import {
    QuestIdea,
    IdeaStore,
    IQuestIdea,
} from '../../../use-cases/entities/brainstorm'
import { InMemoryStore } from './in-memory-store'

export class InMemoryIdeaStore
    extends InMemoryStore<IQuestIdea>
    implements IdeaStore
{
    _class = QuestIdea
}
