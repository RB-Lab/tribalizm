import { Scenes } from 'telegraf'
import { Tribalizm } from '../../../use-cases/tribalism'
import { TelegramUser } from './users-adapter'

export interface TribeCtx extends Scenes.SceneContext {
    user: TelegramUser
    tribalizm: Tribalizm
    reportError: (err: any) => void
}
