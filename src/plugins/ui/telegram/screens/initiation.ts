import { Scenes, Telegraf } from 'telegraf'
import { QuestType } from '../../../../use-cases/entities/quest'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { i18n } from '../../i18n/i18n-ctx'
import { SceneState } from '../scene-state'

function scenes(tribalizm: Tribalizm) {
    const declineInitiaton = new Scenes.BaseScene<Scenes.SceneContext>(
        'declline-application'
    )
    const sceneState = new SceneState<{ questId: string; memberId: string }>()
    declineInitiaton.enter((ctx) => {
        const texts = i18n(ctx).initiation

        ctx.reply(texts.declinePrompt())
    })
    declineInitiaton.on('text', async (ctx) => {
        const texts = i18n(ctx).initiation
        ctx.reply(texts.declineOk())
        // TODO should use the text maybe?
        tribalizm.initiation.decline({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.scene.leave()
    })

    return [declineInitiaton]
}

function actions(bot: Telegraf<Scenes.SceneContext>) {
    bot.action(/propose-initiation:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('quest-negotiation', {
            questId,
            memberId,
            chiefInitiation: true,
        })
    })

    bot.action(/decline-application:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('declline-application', { questId, memberId })
    })
}
export const initiationScreen = { scenes, actions }
