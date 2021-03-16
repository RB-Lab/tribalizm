import { Message } from './message'

export interface NotificationBus {
    notify: <T extends Message>(message: T) => void
    subscribe: <T extends Message>(
        type: T['type'],
        handler: (message: T) => void
    ) => void
}
