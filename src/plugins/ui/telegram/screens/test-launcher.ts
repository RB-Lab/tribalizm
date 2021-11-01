import { Markup, Scenes, Telegraf } from 'telegraf'
import { TelegramUsers } from '../mocks'

export function testLauncher(
    bot: Telegraf<Scenes.SceneContext>,
    telegramUsers: TelegramUsers
) {
    bot.command('/test', (ctx) => {
        const scene = ctx.update.message.text.replace('/test ', '')

        ctx.reply(
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
