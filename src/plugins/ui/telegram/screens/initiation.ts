import { Markup, Telegraf } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { ApplicationMessage } from '../../../../use-cases/apply-tribe'
import {
    ApplicationApprovedMessage,
    ApplicationDeclinedMessage,
    RequestApplicationFeedbackMessage,
} from '../../../../use-cases/initiation'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter, UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import { negotiate } from './quest-negotiation'

interface DeclineState extends UserState {
    type: 'decline-state'
    questId: string
    memberId: string
}
function isDeclineState(state: Maybe<UserState>): state is DeclineState {
    return notEmpty(state) && state.type === 'decline-state'
}

const declineParser = makeCallbackDataParser('decline-application', [
    'memberId',
    'questId',
])

const acceptParser = makeCallbackDataParser('application-accept', [
    'memberId',
    'questId',
])
const appDeclineParser = makeCallbackDataParser('application-decline', [
    'memberId',
    'questId',
])

export function initiationScreen(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    // this is from the get-go, @see notifications/ApplicationMessage
    bot.action(declineParser.regex, (ctx) => {
        const data = declineParser.parse(ctx.match.input)
        ctx.user.setState<DeclineState>({
            type: 'decline-state',
            memberId: data.memberId,
            questId: data.questId,
        })
        const texts = i18n(ctx).initiation
        ctx.reply(texts.declinePrompt())
    })

    bot.action(acceptParser.regex, (ctx) => {
        const data = acceptParser.parse(ctx.match.input)

        ctx.tribalizm.initiation.approveByElder({
            questId: data.questId,
            elderUserId: ctx.user.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.approvedOk(),
            Markup.inlineKeyboard([])
        )
    })
    bot.action(appDeclineParser.regex, async (ctx) => {
        const data = appDeclineParser.parse(ctx.match.input)

        await ctx.tribalizm.initiation.decline({
            questId: data.questId,
            elderUserId: ctx.user.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.declineOk(),
            Markup.inlineKeyboard([])
        )
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (isDeclineState(state)) {
            const texts = i18n(ctx).initiation
            ctx.reply(texts.declineOk())
            // TODO should use the text maybe?
            ctx.tribalizm.initiation.decline({
                questId: state.questId,
                elderUserId: ctx.user.userId,
            })
            ctx.user.setState(null)
        } else {
            next()
        }
    })

    // ================= Handle Notifications

    bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )

            const texts = i18n(elder).notifications.tribeApplication

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    negotiate.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                        elder: payload.elder,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    declineParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
                ),
            ])

            bot.telegram.sendMessage(
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
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).notifications.tribeApplication

            bot.telegram.sendMessage(
                user.chatId,
                texts.applicationDeclined({ tribe: payload.tribeName })
            )
        }
    )
    bus.subscribe<RequestApplicationFeedbackMessage>(
        'request-application-feedback',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.accept(),
                    acceptParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    appDeclineParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
                ),
            ])

            const text = texts.feedbackRequest({
                name: payload.applicantName,
                tribe: payload.tribe,
            })

            bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )

    bus.subscribe<ApplicationApprovedMessage>(
        'application-approved',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            bot.telegram.sendMessage(
                user.chatId,
                texts.applicationApproved({ tribe: payload.tribe })
            )
        }
    )
}
