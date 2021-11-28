import { Scenes } from 'telegraf'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { Tribalizm } from '../../../use-cases/tribalism'
import { TelegramUser } from './users-adapter'

export interface TribeCtx extends Scenes.SceneContext {
    user: TelegramUser
    tribalizm: Tribalizm
    reportError: (err: any) => void
    getCalenar: (
        hanlder: (date: Date, ctx: TribeCtx) => void,
        locale?: string
    ) => ExtraReplyMessage
}
