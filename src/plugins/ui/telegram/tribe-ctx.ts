import { Scenes } from 'telegraf'
import { Tribalizm } from '../../../use-cases/tribalism'

export interface TribeCtx extends Scenes.SceneContext {
    userId: string
    tribalizm: Tribalizm
    reportError: (err: any) => void
}
