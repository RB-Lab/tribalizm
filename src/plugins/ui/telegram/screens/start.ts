import { Markup } from 'telegraf'
import { i18n, toLocale } from '../../i18n/i18n-ctx'
import L from '../../i18n/i18n-node'
import { TgContext } from '../tribe-ctx'

/**
 * Handles `/start` command which is issued whenever new user decides to interact with the bot
 * @param bot Telegraf instance
 * @param telegramUsers users provider plugin to User's store
 */
export function startScreen({ bot, logger }: TgContext) {
    bot.start(async (ctx) => {
        ctx.logEvent('/start')
        const texts = i18n(ctx).start
        // always reset state when user re-starts bot
        await ctx.user.setState(null)

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        await ctx.reply(texts.text(), keyboard)
    })
}
