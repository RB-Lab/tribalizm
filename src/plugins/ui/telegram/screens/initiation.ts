import { Markup, Scenes, Telegraf } from 'telegraf'
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

    const appDecline = new Scenes.BaseScene<Scenes.SceneContext>(
        'application-decline'
    )
    appDecline.enter((ctx) => {
        tribalizm.initiation.decline({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.declineOk(),
            Markup.inlineKeyboard([])
        )
    })

    const appAccept = new Scenes.BaseScene<Scenes.SceneContext>(
        'application-accept'
    )
    appAccept.enter((ctx) => {
        tribalizm.initiation.approveByElder({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.approvedOk(),
            Markup.inlineKeyboard([])
        )
    })

    return [declineInitiaton, appDecline, appAccept]
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

    // this is from the get-go, @see notifications/ApplicationMessage
    bot.action(/decline-application:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('declline-application', { questId, memberId })
    })

    bot.action(/application-accept:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('application-accept', { questId, memberId })
    })
    bot.action(/application-decline:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('application-decline', { questId, memberId })
    })
}
export const initiationScreen = { scenes, actions }
