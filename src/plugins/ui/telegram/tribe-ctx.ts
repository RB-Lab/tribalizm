import { Scenes, Telegraf } from 'telegraf'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { Tribalizm } from '../../../use-cases/tribalism'
import { ILogger } from '../../../use-cases/utils/logger'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { ViewModels } from '../../../view-models/view-models'
import { TelegramMessageStore } from './message-store'
import { TelegramUser, TelegramUsersAdapter } from './users-adapter'

export interface TribeCtx extends Scenes.SceneContext {
    user: TelegramUser
    firstTime: boolean
    tribalizm: Tribalizm
    viewModels: ViewModels
    logEvent: (event: string, meta?: object) => void
    getCalendar: (
        handler: (date: Date, ctx: TribeCtx) => void,
        locale?: string
    ) => ExtraReplyMessage
}

export interface TgContext {
    bot: Telegraf<TribeCtx>
    viewModels: ViewModels
    bus: NotificationBus
    tgUsers: TelegramUsersAdapter
    logger: ILogger
    messageStore: TelegramMessageStore
}
