import { Store } from '../../../use-cases/entities/store'
import { InMemoryStore } from '../../stores/in-memory-store/in-memory-store'
import { MongoStore } from '../../stores/mongo-store/mongo-store'

export interface Message {
    brainstormId: string
    chatId: string
    messageId: number
    text: string
    ideaId: string
}

export interface TelegramMessageStore extends Store<Message> {}

export class TelegramMessageInMemoryStore extends InMemoryStore<Message> {}
export class TelegramMessageMongoStore extends MongoStore<Message> {}
