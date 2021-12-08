import { Markup } from 'telegraf'
import { toLocale } from '../../i18n/i18n-ctx'
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
        const l = toLocale(ctx.message.from.language_code)
        const texts = L[l].start

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        await ctx.reply(texts.text(), keyboard)
    })
}
