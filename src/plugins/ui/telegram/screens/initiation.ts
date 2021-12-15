import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { ApplicationMessage } from '../../../../use-cases/apply-tribe'
import {
    ApplicationApprovedMessage,
    ApplicationDeclinedMessage,
    RequestApplicationFeedbackMessage,
} from '../../../../use-cases/initiation'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import { negotiate } from './quest-negotiation'

interface DeclineState extends UserState {
    type: 'decline-state'
    questId: string
}
function isDeclineState(state: Maybe<UserState>): state is DeclineState {
    return notEmpty(state) && state.type === 'decline-state'
}

const declineParser = makeCallbackDataParser('decline-application', ['questId'])

const acceptParser = makeCallbackDataParser('application-accept', ['questId'])
const appDeclineParser = makeCallbackDataParser('application-decline', [
    'questId',
])

export function initiationScreen({ bot, bus, tgUsers }: TgContext) {
    // this is from the get-go, @see notifications/ApplicationMessage
    bot.action(declineParser.regex, async (ctx) => {
        const data = declineParser.parse(ctx.match.input)
        await ctx.user.setState<DeclineState>({
            type: 'decline-state',
            questId: data.questId,
        })
        const texts = i18n(ctx).initiation
        await ctx.reply(texts.declinePrompt())
    })

    bot.action(acceptParser.regex, async (ctx) => {
        const data = acceptParser.parse(ctx.match.input)
        ctx.logEvent('app accepted', { questId: data.questId })

        await ctx.tribalizm.initiation.approveByElder({
            questId: data.questId,
            userId: ctx.user.userId,
        })
        await ctx.editMessageText(
            i18n(ctx).initiation.approvedOk(),
            Markup.inlineKeyboard([])
        )
    })
    bot.action(appDeclineParser.regex, async (ctx) => {
        const data = appDeclineParser.parse(ctx.match.input)
        ctx.logEvent('app declined', { questId: data.questId })

        await ctx.tribalizm.initiation.decline({
            questId: data.questId,
            userId: ctx.user.userId,
        })
        await ctx.editMessageText(
            i18n(ctx).initiation.declineOk(),
            Markup.inlineKeyboard([])
        )
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (isDeclineState(state)) {
            await ctx.user.setState(null)
            ctx.logEvent('app declined straight away', {
                questId: state.questId,
                reason: ctx.message.text,
            })
            const texts = i18n(ctx).initiation
            await ctx.reply(texts.declineOk())
            // TODO should use the text maybe?
            await ctx.tribalizm.initiation.decline({
                questId: state.questId,
                userId: ctx.user.userId,
            })
        } else {
            return next()
        }
    })

    // ================= Handle Notifications

    bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )

            const texts = i18n(elder).tribeApplication

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    negotiate.serialize({
                        questId: payload.questId,
                        elder: payload.elder,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    declineParser.serialize({
                        questId: payload.questId,
                    })
                ),
            ])

            await bot.telegram.sendMessage(
                elder.chatId,
                `<b>${texts.title({
                    tribe: payload.tribeName,
                })}</b>\n\n${texts.applicant({
                    username: `<i>${payload.userName}</i>`,
                })}\n${texts.coverLetter()}\n${payload.coverLetter}`,
                { parse_mode: 'HTML', reply_markup: keyboard.reply_markup }
            )
        }
    )
    bus.subscribe<ApplicationDeclinedMessage>(
        'application-declined',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).tribeApplication

            await bot.telegram.sendMessage(
                user.chatId,
                texts.applicationDeclined({ tribe: payload.tribeName })
            )
        }
    )
    bus.subscribe<RequestApplicationFeedbackMessage>(
        'request-application-feedback',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
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
                name: payload.applicantName,
                tribe: payload.tribe,
            })

            await bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )

    bus.subscribe<ApplicationApprovedMessage>(
        'application-approved',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            await bot.telegram.sendMessage(
                user.chatId,
                texts.applicationApproved({ tribe: payload.tribe })
            )
        }
    )
}
