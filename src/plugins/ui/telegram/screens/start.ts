import { Markup, Telegraf } from 'telegraf'
import L from '../../i18n/i18n-node'
import { toLocale } from '../../i18n/to-locale'

export function startScreen(bot: Telegraf) {
    bot.start((ctx) => {
        const l = toLocale(ctx.message.from.language_code)
        
        const texts = L[l].start

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        ctx.reply(texts.text(), keyboard)
    })
}
