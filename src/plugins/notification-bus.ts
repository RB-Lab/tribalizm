import { Message } from '../use-cases/utils/message'
import { NotificationBus } from '../use-cases/utils/notification-bus'

type Subscriber = <T extends Message>(message: T) => void | Promise<void>

export class TestNotificationBus implements NotificationBus {
    private _subscribers: Map<Message['type'], Subscriber[]> = new Map()
    notify = async <T extends Message>(message: T) => {
        const subscribers = this._subscribers.get(message.type)
        if (subscribers) {
            for (let s of subscribers) {
                await s(message)
            }
        }
    }
    subscribe = <T extends Message>(
        type: T['type'],
        handler: (message: T) => void
    ) => {
        const subscribers = this._subscribers.get(type)
        if (subscribers) {
            subscribers.push(handler as any)
        } else {
            this._subscribers.set(type, [handler as any])
        }
    }
}
