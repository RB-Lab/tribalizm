import { Scenes } from 'telegraf'
import { SceneSessionData } from 'telegraf/typings/scenes'
import { Tribalizm } from '../../../use-cases/tribalism'

export interface TribeCtx extends Scenes.SceneContext<TribalizmData> {
    userId: string
    tribalizm: Tribalizm
    reportError: (err: any) => void
}
