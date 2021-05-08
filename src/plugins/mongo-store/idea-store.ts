import { IdeaStore, IQuestIdea } from '../../use-cases/entities/brainstorm'
import { MongoStore } from './mongo-store'

export class MongoIdeaStore extends MongoStore<IQuestIdea>
    implements IdeaStore {}
