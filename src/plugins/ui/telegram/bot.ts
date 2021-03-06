import { Telegraf } from 'telegraf'
import { Tribalizm } from '../../../use-cases/tribalism'
import { ILogger } from '../../../use-cases/utils/logger'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { ViewModels } from '../../../view-models/view-models'
import { i18n } from '../i18n/i18n-ctx'
import { DateTimePicker } from './date-time-picker'
import { TelegramMessageStore } from './message-store'
import { brainstormScreen } from './screens/brainstorm'
import { coordinationScreen } from './screens/coordination'
import { createTribeScreen } from './screens/create-tribe'
import { gatheringScreen } from './screens/gathering'
import { helpScreen } from './screens/help'
import { initiationScreen } from './screens/initiation'
import { introQuestsScreen } from './screens/intro-quests'
import { listTribesScreen } from './screens/list-tribes'
import { questNegotiationScreen } from './screens/quest-negotiation'
import { startScreen } from './screens/start'
import { TribeCtx } from './tribe-ctx'
import { TelegramUsersAdapter } from './users-adapter'

interface PublicHookConfig {
    /**
     * domain is used to _ only register_ hook on Telegram server
     * you suppose to use middleware provided by bot.webhookCallback(path: string)
     * in your server later
     * if domain is also provided Telegraf will _automatically_
     * register hook at https://${domain}${hookPath}
     */
    domain?: string
    /** port & path are used to start a server inside a bot */
    port?: number
    path?: string
}
interface Metrics {
    countErrors: (error: unknown) => void
}
interface BotConfig {
    logger: ILogger
    metrics: Metrics
    telegramUsersAdapter: TelegramUsersAdapter
    webHook?: PublicHookConfig
    tribalizm: Tribalizm
    viewModels: ViewModels
    token: string | undefined
    notificationBus: NotificationBus
    messageStore: TelegramMessageStore
    telegramURL?: string
}

export async function makeBot(config: BotConfig) {
    if (config.token === undefined) {
        throw new Error('BOT_TOKEN must be provided!')
    }

    let bot: Telegraf<TribeCtx>

    if (config.telegramURL) {
        bot = new Telegraf<TribeCtx>(config.token, {
            telegram: { apiRoot: config.telegramURL },
        })
    } else {
        bot = new Telegraf<TribeCtx>(config.token)
    }

    bot.catch(async (err, ctx) => {
        config.logger.error(err)
        config.metrics.countErrors(err)
        const texts = i18n(ctx).errors
        ctx.answerCbQuery()
        if (typeof err == 'object' && err?.constructor?.name) {
            const text = (texts as any)[err.constructor.name]()
            // this means there's no translation for this
            if (text === `errors.${err.constructor.name}`) {
                if ('message' in err) {
                    await ctx.reply(
                        texts.commonWithText({ message: String(err) })
                    )
                } else {
                    await ctx.reply(texts.common())
                }
            } else {
                await ctx.reply(text)
            }
        } else {
            await ctx.reply(texts.common())
        }
    })

    // add tribalizm
    bot.use(async (ctx, next) => {
        ctx.tribalizm = config.tribalizm
        ctx.viewModels = config.viewModels
        return next()
    })

    // Authentication kinda
    bot.use(async (ctx, next) => {
        if (!ctx.chat || !ctx.from) {
            throw new Error("Can't authenticate user without chat data")
        }
        let user = await config.telegramUsersAdapter.getUserByChatId(
            ctx.chat.id
        )
        if (user) {
            ctx.user = user
            ctx.firstTime = false
        } else {
            const name =
                ctx.from.first_name +
                (ctx.from.last_name ? ` ${ctx.from.last_name}` : '')
            ctx.user = await config.telegramUsersAdapter.createUser(name, {
                chatId: String(ctx.chat.id),
                locale: ctx.from.language_code,
                username: ctx.from.username,
            })
            ctx.firstTime = true
        }
        return next()
    })

    // analytics
    bot.use(async (ctx, next) => {
        ctx.logEvent = (event: string, meta?: object) => {
            const username = ctx.user.username
            const name = `${ctx.message?.from.first_name || ''} ${
                ctx.message?.from.last_name || ''
            }`
            config.logger.event(event, {
                ...meta,
                username: username || name,
                userId: ctx.user.userId,
            })
        }
        return next()
    })

    const datePicker = new DateTimePicker(bot, config.logger)
    bot.use(async (ctx, next) => {
        ctx.getCalendar = datePicker.getCalendar
        return next()
    })

    const tgContext = {
        bot,
        viewModels: config.viewModels,
        bus: config.notificationBus,
        tgUsers: config.telegramUsersAdapter,
        logger: config.logger,
        messageStore: config.messageStore,
    }
    startScreen(tgContext)
    helpScreen(tgContext)
    listTribesScreen(tgContext)
    createTribeScreen(tgContext)
    initiationScreen(tgContext)
    questNegotiationScreen(tgContext)
    introQuestsScreen(tgContext)
    brainstormScreen(tgContext)
    coordinationScreen(tgContext)
    gatheringScreen(tgContext)

    // unhandled text (???? Spirits may hear you...)
    bot.on('text', async (ctx) => {
        ctx.logEvent('unhandled text', { text: ctx.message.text })
        return ctx.reply(i18n(ctx).unhandledText())
    })

    if (config.webHook) {
        await bot.launch({
            webhook: { ...config.webHook, hookPath: config.webHook.path },
        })
    }
    return bot
}
