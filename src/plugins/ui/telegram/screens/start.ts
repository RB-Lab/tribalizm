import { Markup, Scenes, Telegraf } from 'telegraf'
import L from '../../i18n/i18n-node'
import { toLocale } from '../../i18n/to-locale'
import { TelegramUsers } from '../mocks'

/**
 * Handles `/start` command which is issued whenever new user decides to interact with the bot
 * @param bot Telegraf instance
 * @param telegramUsers users provider plugin to User's store
 */
export function startScreen(
    bot: Telegraf<Scenes.SceneContext>,
    telegramUsers: TelegramUsers
) {
    bot.start(async (ctx) => {
        const l = toLocale(ctx.message.from.language_code)

        const texts = L[l].start

        const name =
            ctx.from.first_name +
            (ctx.from.last_name ? ` ${ctx.from.last_name}` : '')
        await telegramUsers.createUser(name, {
            chatId: String(ctx.chat.id),
            locale: ctx.from.language_code,
            username: ctx.from.username,
        })

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        ctx.reply(texts.text(), keyboard)
    })
}
