import express, { ErrorRequestHandler } from 'express'
import TelegramServer from 'telegram-test-api'
import http from 'http'
import Transport from 'winston-transport'
import { adminApi } from '../../plugins/api/admin'
import { InMemoryStore } from '../../plugins/stores/in-memory-store/in-memory-store'
import { makeBot } from '../../plugins/ui/telegram/bot'
import { TelegramMessageInMemoryStore } from '../../plugins/ui/telegram/message-store'
import {
    ITelegramUser,
    StoreTelegramUsersAdapter,
} from '../../plugins/ui/telegram/users-adapter'
import { Awaited, noop, notEmpty } from '../../ts-utils'
import { StoredCity } from '../../use-cases/entities/city'
import { Member } from '../../use-cases/entities/member'
import { createContext } from '../test-context'

type TelegramClient = ReturnType<TelegramServer['getClient']>
type UpdatePromise = ReturnType<TelegramClient['getUpdates']>
type BotUpdate = Awaited<UpdatePromise>['result'][0]

export function getInlineKeyCallbacks(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'inline_keyboard' in markup) {
        return markup.inline_keyboard
            .map((bs) =>
                bs.map((b) => ('callback_data' in b && b.callback_data) || null)
            )
            .flat()
            .filter(notEmpty)
    }
    return []
}
export function getInlineKeys(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'inline_keyboard' in markup) {
        return markup.inline_keyboard
            .map((bs) => bs.map((b) => b.text))
            .flat()
            .filter(notEmpty)
    }
    return []
}

export function getKeyboardButtons(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'keyboard' in markup) {
        return markup.keyboard.flat()
    }
    return []
}

export function wrapClient(server: TelegramServer, client: TelegramClient) {
    let lastUpdate: BotUpdate
    /**
     * Send reply to chat of specific client
     * @param text if omitted, chat will just wait for updates, if starts with `/`
     *             command will be sent, if last message contained `text` among its
     *             buttons callbacks, then callback reply to that message will be sent
     * @returns last update from bot or previous message if bot edited it
     */
    async function chat(text?: string, waitEdit?: true) {
        debugName((client as any).userName)
        if (text === undefined) {
            // do nothing, just wait for updates, & replace the last one
        } else if (text.startsWith('/')) {
            debugUser('Command', text)
            await client.sendCommand(client.makeCommand(text))
        } else if (getInlineKeyCallbacks(lastUpdate).includes(text)) {
            callback(text)
        } else {
            debugUser('Message', text)
            await client.sendMessage(client.makeMessage(text))
        }
        return waitResult(waitEdit)
    }
    async function waitResult(waitEdit?: true) {
        let result: BotUpdate[]
        if (waitEdit) {
            await server.waitBotEdits()
            const hist = await client.getUpdatesHistory()
            result = hist
                .filter((u) => u.updateId === lastUpdate.updateId)
                .filter(isBotUpdate)
        } else {
            result = (await client.getUpdates()).result
        }
        lastUpdate = result[result.length - 1]
        debugBot(result)
        return result
    }
    async function chatLast(text?: string, waitEdit?: true) {
        await chat(text, waitEdit)
        return lastUpdate
    }
    async function callback(data: string) {
        debugUser('Callback', data)
        await client.sendCallback(
            client.makeCallbackQuery(data, {
                message: {
                    message_id: lastUpdate.messageId,
                    text: lastUpdate.message.text,
                },
            })
        )
    }
    async function forceCallback(data: string, waitEdit?: true) {
        await callback(data)
        return waitResult(waitEdit)
    }

    return {
        chat,
        chatLast,
        client,
        forceCallback,
    }
}

function isBotUpdate(u: any): u is BotUpdate {
    return 'message' in u && 'chat_id' in u.message
}

let lastName = ''
function debugName(name: string) {
    if (process.env.chatDebug) {
        console.log()
        if (lastName !== name) {
            console.log('\x1b[31m%s\x1b[0m', `== ${name} ==`)
            lastName = name
        }
    }
}

function debug(...args: any[]) {
    if (process.env.chatDebug) {
        console.log(...args)
    }
}

function debugUser(type: string, text: string) {
    if (process.env.chatDebug) {
        console.log('\x1b[34m%s\x1b[0m', ` ← ${type}:`, text)
    }
}
function debugBot(updates: BotUpdate[]) {
    if (process.env.chatDebug) {
        const upds = updates.map((u) => {
            const keys = getInlineKeys(u)
            const keyLimit = 7
            if (keys.length) {
                const end = keys.length > keyLimit ? '...' : ''
                return `${u.message.text}\n[${keys
                    .slice(0, keyLimit)
                    .join('] [')}]${end}`
            }
            return u.message.text
        })
        console.log('\x1b[32m%s\x1b[0m', ` → `, upds.join('\n\n'))
    }
}

export function debugKeyboard(lastUpdate: BotUpdate) {
    if (process.env.chatDebug) {
        console.log((lastUpdate?.message?.reply_markup as any)?.inline_keyboard)
    }
}
class TgUserStore extends InMemoryStore<ITelegramUser> {}

export async function createTelegramContext(
    context: Awaited<ReturnType<typeof createContext>>
) {
    const token = '-test-bot-token'
    const server = new TelegramServer({ port: 9001 })

    const api = express()
    api.use(express.json())

    const apiRoutes = adminApi(context.tribalizm, context.viewModels, api)

    await server.start()

    const messageStore = new TelegramMessageInMemoryStore()
    class SpyTransport extends Transport {
        log = (info: any, next: () => void) => {
            console.log(info)
            next()
        }
    }
    const tgUsersStore = new TgUserStore()
    const telegramUsersAdapter = new StoreTelegramUsersAdapter(
        context.stores.userStore,
        tgUsersStore,
        context.logger
    )
    const bot = await makeBot({
        notificationBus: context.async.notificationBus,
        metrics: {
            countErrors: noop,
        },
        token,
        tribalizm: context.tribalizm,
        viewModels: context.viewModels,
        webHook: {
            port: 9002,
            path: '/tg-hook',
        },
        telegramUsersAdapter,
        messageStore,
        telegramURL: server.config.apiURL,
        logger: context.logger,
    })
    bot.telegram.setWebhook('http://localhost:9002/tg-hook')

    function makeClient(user: string, chat: string) {
        makeClient.counter++
        return wrapClient(
            server,
            server.getClient(token, {
                firstName: user,
                userName: chat,
                chatId: makeClient.counter,
                userId: makeClient.counter,
            })
        )
    }
    makeClient.counter = 0

    async function addTribeMember(
        client: ReturnType<typeof wrapClient>,
        tribeId: string,
        city?: StoredCity
    ) {
        await client.chat('/start')
        const user = await context.stores.userStore._last()

        if (city) {
            const tgUser =
                await telegramUsersAdapter.getTelegramUserForTribalism(user.id)
            await tgUser.locate(city.id, city.timeZone)
        }
        const member = await context.stores.memberStore.save(
            new Member({
                tribeId,
                userId: user!.id,
                isCandidate: false,
            })
        )
        return { ...client, user, member }
    }

    async function callAdminApi(route: keyof typeof apiRoutes, data: object) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(data)
            const req = http.request(
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': body.length,
                    },
                    path: apiRoutes[route],
                    hostname: 'localhost',
                    port: 5674,
                },
                (res) => {
                    let d = ''
                    res.on('data', (chunk) => (d += chunk))
                    res.on('end', () => {
                        resolve(d)
                    })
                    res.on('error', reject)
                }
            )

            req.on('error', (err) => {
                console.log('error', err)
                reject(err)
            })

            req.write(body)
            req.end()
        })
    }
    const apiServer = api.listen(5674)

    return { server, bot, makeClient, addTribeMember, callAdminApi }
}
