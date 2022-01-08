import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { ApplicationMessage } from '../../../../use-cases/apply-tribe'
import {
    ApplicationApprovedMessage,
    ApplicationDeclinedMessage,
    RequestApplicationFeedbackMessage,
} from '../../../../use-cases/initiation'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import { negotiate } from './quest-negotiation'

const acceptParser = makeCallbackDataParser('application-accept', ['questId'])
const appDeclineParser = makeCallbackDataParser('application-decline', [
    'questId',
])

export function initiationScreen(context: TgContext) {
    context.bot.action(acceptParser.regex, async (ctx) => {
        const data = acceptParser.parse(ctx.match.input)
        ctx.logEvent('app accepted', { questId: data.questId })

        await ctx.tribalizm.initiation.approve({
            questId: data.questId,
            userId: ctx.user.userId,
        })
        await removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).initiation.approvedOk())
    })
    context.bot.action(appDeclineParser.regex, async (ctx) => {
        const data = appDeclineParser.parse(ctx.match.input)
        ctx.logEvent('app declined', { questId: data.questId })

        await ctx.tribalizm.initiation.decline({
            questId: data.questId,
            userId: ctx.user.userId,
        })
        await removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).initiation.declineOk())
    })

    // ================= Handle Notifications

    context.bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await context.tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const app = await context.viewModels.application.getApplicationInfo(
                payload.questId
            )

            const texts = i18n(elder).tribeApplication

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    negotiate.serialize({
                        questId: payload.questId,
                    })
                ),
                // TODO add "skip" button (see use-cases/initiation as well)
            ])

            await context.bot.telegram.sendMessage(
                elder.chatId,
                `<b>${texts.title({
                    tribe: app.tribe,
                })}</b>\n\n${texts.applicant({
                    username: `<i>${app.applicantName}</i>`,
                })}\n${texts.coverLetter()}\n${app.coverLetter}`,
                { parse_mode: 'HTML', reply_markup: keyboard.reply_markup }
            )
        }
    )
    context.bus.subscribe<ApplicationDeclinedMessage>(
        'application-declined',
        async ({ payload }) => {
            const user = await context.tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).tribeApplication

            await context.bot.telegram.sendMessage(
                user.chatId,
                texts.applicationDeclined({ tribe: payload.tribeName })
            )
        }
    )

    context.bus.subscribe<RequestApplicationFeedbackMessage>(
        'request-application-feedback',
        async ({ payload }) => {
            const user = await context.tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const app = await context.viewModels.application.getApplicationInfo(
                payload.questId
            )
            const texts = i18n(user).initiation

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.accept(),
                    acceptParser.serialize({
                        questId: payload.questId,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    appDeclineParser.serialize({
                        questId: payload.questId,
                    })
                ),
            ])

            const text = texts.feedbackRequest({
                name: app.applicantName,
                tribe: app.tribe,
            })

            await context.bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )

    context.bus.subscribe<ApplicationApprovedMessage>(
        'application-approved',
        async ({ payload }) => {
            const user = await context.tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            await context.bot.telegram.sendMessage(
                user.chatId,
                texts.applicationApproved({ tribe: payload.tribe })
            )
        }
    )
}
