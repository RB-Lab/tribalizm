import { Scenes, session, Telegraf } from 'telegraf'
import { Tribalizm, wrapWithErrorHandler } from '../../../use-cases/tribalism'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { i18n } from '../i18n/i18n-ctx'
import { initiationScreen } from './screens/initiation'
import { introQuests } from './screens/intro-quests'
import { questNegotiationScreen } from './screens/quest-negotiation'
import { rateMemberScreen } from './screens/rate-member'
import { rulesScreen } from './screens/rules'
import { startScreenActions } from './screens/start'
import { tribesListScreen } from './screens/tribes-list'
import { TribeCtx } from './tribe-ctx'
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
    reportError?: (err: unknown) => Promise<void> | void
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

    const reportError = config.reportError || (() => {})

    let bot: Telegraf<TribeCtx>

    if (config.telegramURL) {
        bot = new Telegraf<TribeCtx>(config.token, {
            telegram: { apiRoot: config.telegramURL },
        })
    } else {
        bot = new Telegraf<TribeCtx>(config.token)
    }

    bot.use(async (ctx, next) => {
        async function reportContextError(err: unknown) {
            const texts = i18n(ctx).errors
            if (typeof err == 'object' && err?.constructor?.name) {
                const errorMessage = (texts as any)[err.constructor.name]
                if (errorMessage) {
                    ctx.reply(errorMessage())
                } else {
                    ctx.reply(texts.common())
                }
            } else {
                ctx.reply(texts.common())
            }
            await reportError(err)
        }
        ctx.tribalizm = wrapWithErrorHandler(
            config.tribalism,
            reportContextError
        )
        ctx.reportError = reportContextError
        next()
    })

    bot.use(async (ctx, next) => {
        if (!ctx.chat || !ctx.from) {
            ctx.reportError(
                new Error("Can't authenticate user without chat data")
            )
            return
        }
        try {
            ctx.state.userId =
                await config.telegramUsersAdapter.getUserIdByChatId(ctx.chat.id)
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
        } catch (err) {
            ctx.reportError(err)
        }
    })

    bot.use(session())

    const stage = new Scenes.Stage([
        ...(rulesScreen.scenes() as any),
        ...tribesListScreen.scenes(),
        ...questNegotiationScreen.scenes(),
        ...initiationScreen.scenes(),
    ])
    bot.use(stage.middleware() as any)

    rulesScreen.actions(bot)
    initiationScreen.actions(bot)
    questNegotiationScreen.actions(bot)
    tribesListScreen.actions(bot)
    rateMemberScreen.actions(bot)
    introQuests.actions(bot)
    startScreenActions(bot)

    questNegotiationScreen.attachNotifications(
        bot,
        config.notifcationsBus,
        config.telegramUsersAdapter
    )
    initiationScreen.attachNotifications(
        bot,
        config.notifcationsBus,
        config.telegramUsersAdapter
    )
    rateMemberScreen.attachNotifications(
        bot,
        config.notifcationsBus,
        config.telegramUsersAdapter
    )
    introQuests.attachNotifications(
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
