import { Scenes, session, Telegraf } from 'telegraf'
import { Tribalizm } from '../../../use-cases/tribalism'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { attachNotifications } from './notifications'
import { initiationScreen } from './screens/initiation'
import { questNegotiationScreen } from './screens/quest-negotiation'
import { rateMemberScreen } from './screens/rate-member'
import { rulesScreen } from './screens/rules'
import { startScreenActions } from './screens/start'
import { tribesListScreen } from './screens/tribes-list'
import { TelegramUsersAdapter } from './users-adapter'

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
        if (!ctx.chat || !ctx.from) {
            throw new Error("Can't authenticate user without chat data")
        }
        ctx.state.userId = await config.telegramUsersAdapter.getUserIdByChatId(
            ctx.chat.id
        )

        if (!ctx.state.userId) {
            const name =
                ctx.from.first_name +
                (ctx.from.last_name ? ` ${ctx.from.last_name}` : '')
            ctx.state.userId = await config.telegramUsersAdapter.createUser(
                name,
                {
                    chatId: String(ctx.chat.id),
                    locale: ctx.from.language_code,
                    username: ctx.from.username,
                }
            )
        }
        next()
    })
    bot.use(session())

    // TODO don't forget to handle all exceptions:
    //      - those with specifc class should be handled somewhere below
    //      - genereic Errors will porpagate up to here and must be reported
    bot.catch((err, ctx) => {
        console.error('============================')
        console.error(err)
        console.error('============================')
        ctx.reply(String(err))
    })

    const stage = new Scenes.Stage<Scenes.SceneContext>([
        ...rulesScreen.scenes(),
        ...tribesListScreen.scenes(config.tribalism),
        ...questNegotiationScreen.scenes(config.tribalism),
        ...initiationScreen.scenes(config.tribalism),
    ])
    bot.use(stage.middleware())

    rulesScreen.actions(bot)
    initiationScreen.actions(bot)
    questNegotiationScreen.actions(bot)
    tribesListScreen.actions(bot)
    rateMemberScreen.actions(bot, config.tribalism)
    startScreenActions(bot)

    attachNotifications(
        bot,
        config.notifcationsBus,
        config.telegramUsersAdapter
    )
    rateMemberScreen.attachNotifications(
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
