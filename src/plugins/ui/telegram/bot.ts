// TODO don't forget to handle all exceptions:
//      - those with specifc class should be handled somewhere below
//      - genereic Errors will porpagate up to here and must be reported

import { Scenes, session, Telegraf } from 'telegraf'
import { startScreen } from './screens/start'
import { rulesScreen } from './screens/rules'
import { tribesListScreen } from './screens/tribes-list'
import { attachNotifications } from './notifications'
import { initiationScreen } from './screens/initiation'
import { testLauncher } from './screens/test-launcher'
import { TelegramUsersAdapter } from './users-adapter'
import { Tribalizm } from '../../../use-cases/tribalism'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'

interface LocalHookConfig {
    /** port & path are used to start a server inside a bot */
    port: number
    path: string
    /**
     * if domain is also provided Telegraf will _automatically_
     * register hook at https://${domain}${hookPath}
     */
    domain?: string
}
interface PublicHookConfig {
    /**
     * domain is used to _ only register_ hook on Telegram server
     * you suppose to use middleware provided by bot.webhookCallback(path: string)
     * in your server later
     */
    domain: string
}
interface BotConfig {
    telegramUsersAdapter: TelegramUsersAdapter
    webHook: LocalHookConfig | PublicHookConfig
    tribalism: Tribalizm
    token: string | undefined
    notifcationsBus: NotificationBus
    telegramURL?: string
}
export async function makeBot(config: BotConfig) {
    if (config.token === undefined) {
        throw new Error('BOT_TOKEN must be provided!')
    }

    let bot: Telegraf<Scenes.SceneContext>

    if (config.telegramURL) {
        bot = new Telegraf<Scenes.SceneContext>(config.token, {
            telegram: { apiRoot: config.telegramURL },
        })
    } else {
        bot = new Telegraf<Scenes.SceneContext>(config.token)
    }

    bot.use(async (ctx, next) => {
        ctx.state.user = null
        if (ctx.chat && ctx.from) {
            ctx.state.user = await config.telegramUsersAdapter.getUserByChatId(
                ctx.chat.id
            )
            if (!ctx.state.user) {
                const name =
                    ctx.from.first_name +
                    (ctx.from.last_name ? ` ${ctx.from.last_name}` : '')
                await config.telegramUsersAdapter.createUser(name, {
                    chatId: String(ctx.chat.id),
                    locale: ctx.from.language_code,
                    username: ctx.from.username,
                })
            }
        }
        next()
    })
    bot.use(session())

    bot.catch((err, ctx) => {
        console.error('============================')
        console.error(err)
        console.error('============================')
        ctx.reply(String(err))
    })

    startScreen(bot)
    rulesScreen(bot)
    tribesListScreen(bot, config.tribalism)
    initiationScreen(bot, config.tribalism)
    attachNotifications(
        bot,
        config.notifcationsBus,
        config.telegramUsersAdapter
    )

    // TODO for bridge I need domain AND hook. Also it looks like it starts server anyway
    if ('domain' in config.webHook) {
        await bot.launch({ webhook: { domain: config.webHook.domain } })
    } else if ('path' in config.webHook) {
        await bot.telegram.setWebhook(
            `http://localhost:${config.webHook.port}${config.webHook.path}`
        )
        await bot.launch({
            webhook: {
                hookPath: config.webHook.path,
                port: config.webHook.port,
            },
        })
    }

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))

    return bot
}
