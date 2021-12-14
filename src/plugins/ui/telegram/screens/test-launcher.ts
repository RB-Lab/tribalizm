import { Markup, Telegraf } from 'telegraf'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter } from '../users-adapter'

export function testLauncher(
    bot: Telegraf<TribeCtx>,
    telegramUsers: TelegramUsersAdapter
) {
    bot.command('/test', async (ctx) => {
        const scene = ctx.update.message.text.replace('/test ', '')

        await ctx.reply(
            `Testing scene ${scene}`,
            Markup.inlineKeyboard([
                Markup.button.callback('Start test', `test-scene:${scene}`),
            ])
        )
    })
    bot.action(/test-scene:(.*)/, async (ctx) => {
        await telegramUsers.createUser(ctx.from!.first_name, {
            chatId: String(ctx.chat!.id),
            locale: ctx.from!.language_code,
            username: ctx.from?.username,
        })
        ctx.answerCbQuery()
        ctx.scene.enter(ctx.match[1])
    })
}
