import TelegramServer from 'telegram-test-api'
import { makeBot } from '../../plugins/ui/telegram/bot'
import { StoreTelegramUsersAdapter } from '../../plugins/ui/telegram/users-adapter'
import { Awaited, notEmpty } from '../../ts-utils'
import { Member } from '../../use-cases/entities/member'
import { createContext } from '../test-context'

type TelegramClient = ReturnType<TelegramServer['getClient']>
type UpdatePromise = ReturnType<TelegramClient['getUpdates']>
type BotUpdate = Awaited<UpdatePromise>['result'][0]

export function getInlineKeyCallbacks(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'inline_keyboard' in markup) {
        return flatten(
            markup.inline_keyboard.map((bs) =>
                bs.map((b) => ('callback_data' in b && b.callback_data) || null)
            )
        ).filter(notEmpty)
    }
    return []
}
export function getInlineKeys(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'inline_keyboard' in markup) {
        return flatten(
            markup.inline_keyboard.map((bs) => bs.map((b) => b.text))
        ).filter(notEmpty)
    }
    return []
}

export function getKeyboardButtons(update: BotUpdate | undefined) {
    const markup = update?.message.reply_markup
    if (markup && 'keyboard' in markup) {
        return flatten(markup.keyboard)
    }
    return []
}
/** array [[x]] → [x] */
function flatten<T>(arr: T[][]): T[] {
    return Array.prototype.concat.apply([], arr)
}

export function wrapClient(server: TelegramServer, client: TelegramClient) {
    let lastUpdate: BotUpdate
    /**
     * Send reply to chat of scpecific client
     * @param text if ommited, chat will just wait for updates, if starts with `/`
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
            debugUser('Callback', text)
            await client.sendCallback(
                client.makeCallbackQuery(text, {
                    message: {
                        message_id: lastUpdate.messageId,
                        text: lastUpdate.message.text,
                    },
                })
            )
        } else {
            debugUser('Message', text)
            await client.sendMessage(client.makeMessage(text))
        }

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

    return {
        chat,
        chatLast,
        client,
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

export function log(...args: any[]) {
    let mark = 'WTF'
    if (args.length > 1) {
        mark = args.shift()
    }
    console.log(`==========  ${mark}  =========`)
    console.log(...args)
    console.log('=============================')
}

export async function createTelegramContext(
    context: Awaited<ReturnType<typeof createContext>>
) {
    const token = '-test-bot-token'
    const server = new TelegramServer({ port: 9001 })
    await server.start()

    const bot = await makeBot({
        notifcationsBus: context.async.notififcationBus,
        token,
        tribalism: context.tribalism,
        webHook: {
            port: 9002,
            path: '/tg-hook',
        },
        telegramUsersAdapter: new StoreTelegramUsersAdapter(
            context.stores.userStore
        ),
        telegramURL: server.config.apiURL,
        reportError: (err) => {
            if (process.env.chatDebug) {
                console.error(err)
            }
        },
    })

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
        tribeId: string
    ) {
        await client.chat('/start')
        const user = await context.stores.userStore._last()

        const member = await context.stores.memberStore.save(
            new Member({
                tribeId,
                userId: user!.id,
                isCandidate: false,
            })
        )
        return { ...client, user, member }
    }

    return { server, bot, makeClient, addTribeMember }
}
