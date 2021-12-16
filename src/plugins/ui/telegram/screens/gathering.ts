import { Markup } from 'telegraf'
import { GatheringMessage } from '../../../../use-cases/gathering-declare'
import { HowWasGatheringMessage } from '../../../../use-cases/gathering-finale'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'

const accept = makeCallbackDataParser('gathering-ack', ['gatheringId'])
const decline = makeCallbackDataParser('gathering-decline', ['gatheringId'])

const rateGathering = makeCallbackDataParser('gathering-vote', [
    'gatheringId',
    'score',
])

export function gatheringScreen({ bot, bus, tgUsers }: TgContext) {
    bot.action(accept.regex, async (ctx) => {
        const data = accept.parse(ctx.match[0])
        ctx.logEvent('gathering: accept', { gatheringId: data.gatheringId })
        await ctx.tribalizm.gatheringAcknowledge.accept({
            gatheringId: data.gatheringId,
            userId: ctx.user.userId,
        })
        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).gathering.accepted())
    })
    bot.action(decline.regex, async (ctx) => {
        const data = decline.parse(ctx.match[0])
        ctx.logEvent('gathering: decline', { gatheringId: data.gatheringId })
        await ctx.tribalizm.gatheringAcknowledge.decline({
            gatheringId: data.gatheringId,
            userId: ctx.user.userId,
        })
        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).gathering.declined())
    })
    bot.action(rateGathering.regex, async (ctx) => {
        const data = rateGathering.parse(ctx.match[0])
        ctx.logEvent('gathering: vote', {
            gatheringId: data.gatheringId,
            score: data.score,
        })

        await ctx.tribalizm.gatheringFinale.finalize({
            score: data.score,
            gatheringId: data.gatheringId,
            userId: ctx.user.userId,
        })
        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).gathering.rateDone())
    })

    // =============== Handle Notification ===============
    bus.subscribe<GatheringMessage>(
        'new-gathering-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).gathering
            const params = {
                gatheringId: payload.gatheringId,
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
                date: user.toUserTime(new Date(payload.time)),
                place: payload.place,
            })
            const text = texts.declared({
                proposal,
                reason: payload.description,
            })
            await bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )
    bus.subscribe<HowWasGatheringMessage>(
        'how-was-gathering-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).gathering

            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.rates as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    rateGathering.serialize({
                        gatheringId: payload.gatheringId,
                        score,
                    })
                )
            })
            await bot.telegram.sendMessage(
                user.chatId,
                texts.ratePrompt(),
                Markup.inlineKeyboard([...keys])
            )
        }
    )
}
