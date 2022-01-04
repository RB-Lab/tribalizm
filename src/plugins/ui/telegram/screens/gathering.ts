import { Markup } from 'telegraf'
import { GatheringMessage } from '../../../../use-cases/gathering-declare'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'

const accept = makeCallbackDataParser('gathering-ack', ['gatheringId'])
const decline = makeCallbackDataParser('gathering-decline', ['gatheringId'])

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
}
