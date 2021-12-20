import { Markup } from 'telegraf'
import { base64Decode } from '../../../../ts-utils'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext } from '../tribe-ctx'
import { tribeView } from './views/tribe'

/**
 * Handles `/start` command which is issued whenever new user decides to interact with the bot
 * @param bot Telegraf instance
 * @param telegramUsers users provider plugin to User's store
 */
export function startScreen({ bot }: TgContext) {
    bot.start(async (ctx) => {
        // always reset state when user re-starts bot
        await ctx.user.setState(null)

        const startTribe = ctx.message.text.replace(/\/start\s*/, '')
        if (startTribe) {
            const tribeId = base64Decode(startTribe).replace('tribe=', '')
            ctx.logEvent('/start', { tribeId })
            const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
                tribeId,
            })

            const view = tribeView(ctx, tribeInfo)
            if (tribeInfo.logo) {
                return ctx.telegram.sendPhoto(ctx.chat.id, tribeInfo.logo, {
                    caption: view.text,
                    ...view.extra,
                })
            } else {
                return ctx.reply(view.text, view.extra)
            }
        }
        ctx.logEvent('/start')
        const texts = i18n(ctx).start

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        await ctx.reply(texts.text(), keyboard)
    })
}
