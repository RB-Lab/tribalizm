import { Markup } from 'telegraf'
import { GatheringMessage } from '../../../../use-cases/gathering-declare'
import { HowWasGatheringMessage } from '../../../../use-cases/gathering-finale'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'

const accept = makeCallbackDataParser('gathering-ack', [
    'memberId',
    'gatheringId',
])
const decline = makeCallbackDataParser('gathering-decline', [
    'memberId',
    'gatheringId',
])

const vote = makeCallbackDataParser('rate-gathering', [
    'memberId',
    'gatheringId',
    'score',
])

export function gatheringScreen({ bot, bus, tgUsers }: TgContext) {
    bot.action(accept.regex, async (ctx) => {
        const data = accept.parse(ctx.match[0])
        ctx.logEvent('gathering: accept', { gatheringId: data.gatheringId })
        await ctx.tribalizm.gatheringAcknowledge.accept(data)
        await ctx.reply(i18n(ctx).gathering.accepted())
    })
    bot.action(decline.regex, async (ctx) => {
        const data = decline.parse(ctx.match[0])
        ctx.logEvent('gathering: decline', { gatheringId: data.gatheringId })
        await ctx.tribalizm.gatheringAcknowledge.decline(data)
        await ctx.reply(i18n(ctx).gathering.declined())
    })
    bot.action(vote.regex, async (ctx) => {
        const data = vote.parse(ctx.match[0])
        ctx.logEvent('gathering: vote', {
            gatheringId: data.gatheringId,
            score: data.score,
        })
        await ctx.tribalizm.gatheringFinale.finalize(data)
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
                    vote.serialize({
                        memberId: payload.targetMemberId,
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
