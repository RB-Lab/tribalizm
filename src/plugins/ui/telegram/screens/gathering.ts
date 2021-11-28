import { Markup, Telegraf } from 'telegraf'
import { GatheringMessage } from '../../../../use-cases/gathering-declare'
import { HowWasGatheringMessage } from '../../../../use-cases/gathering-finale'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

function actions(bot: Telegraf<TribeCtx>) {
    bot.action(accept.regex, async (ctx) => {
        const data = accept.parse(ctx.match[0])
        await ctx.tribalizm.gateringAcknowledge.accept(data)
        ctx.reply(i18n(ctx).gathering.accepted())
    })
    bot.action(decline.regex, async (ctx) => {
        const data = decline.parse(ctx.match[0])
        await ctx.tribalizm.gateringAcknowledge.decline(data)
        ctx.reply(i18n(ctx).gathering.declined())
    })
    bot.action(vote.regex, async (ctx) => {
        const data = vote.parse(ctx.match[0])
        await ctx.tribalizm.gatheringFinale.finalize(data)
        ctx.reply(i18n(ctx).gathering.rateDone())
    })
}

const accept = makeCalbackDataParser('gathering-ack', [
    'memberId',
    'gatheringId',
])
const decline = makeCalbackDataParser('gathering-decline', [
    'memberId',
    'gatheringId',
])

const vote = makeCalbackDataParser('rate-gathering', [
    'memberId',
    'gatheringId',
    'score',
])

function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<GatheringMessage>(
        'new-gathering-message',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).gathering
            const params = {
                gatheringId: payload.gatheringId,
                memberId: payload.targetMemberId,
            }
            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.accept(),
                    accept.serialize(params)
                ),
                Markup.button.callback(
                    texts.decline(),
                    decline.serialize(params)
                ),
            ])
            const proposal = texts.proposal({
                date: new Date(payload.time),
                place: payload.place,
            })
            const text = texts.declared({
                proposal,
                reason: payload.description,
            })
            bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )
    bus.subscribe<HowWasGatheringMessage>(
        'how-was-gathering-message',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).gathering

            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.rates as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    vote.serialize({
                        memberId: payload.targetMemberId,
                        gatheringId: payload.gatheringId,
                        score,
                    })
                )
            })
            bot.telegram.sendMessage(
                user.chatId,
                texts.ratePrompt(),
                Markup.inlineKeyboard([...keys])
            )
        }
    )
}

export const gatheringScreen = { attachNotifications, actions }
