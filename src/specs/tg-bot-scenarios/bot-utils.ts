import TelegramServer from 'telegram-test-api'
import { KeyboardButton } from 'typegram'
import { Awaited, notEmpty } from '../../ts-utils'

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

export function makeChat(server: TelegramServer, client: TelegramClient) {
    let lastUpdate: BotUpdate
    const debug = chatDebug(client)
    /**
     * Send reply to chat of scpecific client
     * @param text if ommited, chat will just wait for updates, if starts with `/`
     *             command will be sent, if last message contained `text` among its
     *             buttons callbacks, then callback reply to that message will be sent
     * @returns last update from bot or previous message if bot edited it
     */
    async function chat(text?: string, waitEdit?: true) {
        if (text === undefined) {
            // do nothing, just wait for updates, & replace the last one
        } else if (text.startsWith('/')) {
            debug('command', text)
            await client.sendCommand(client.makeCommand(text))
        } else if (getInlineKeyCallbacks(lastUpdate).includes(text)) {
            debug('callback', text)
            await client.sendCallback(
                client.makeCallbackQuery(text, {
                    message: {
                        message_id: lastUpdate.messageId,
                        text: lastUpdate.message.text,
                    },
                })
            )
        } else {
            debug('message', text)
            await client.sendMessage(client.makeMessage(text))
        }
        debug('>...')

        if (waitEdit) {
            await server.waitBotEdits()
            const hist = await client.getUpdatesHistory()
            lastUpdate = hist.find(
                (u) => u.updateId === lastUpdate.updateId && isBotUpdate(u)
            )! as any
        } else {
            const result = (await client.getUpdates()).result
            lastUpdate = result[result.length - 1]
        }
        debug(lastUpdate.message.text, '\n------------')
        return lastUpdate
    }
    return chat
}

function isBotUpdate(u: any): u is BotUpdate {
    return 'message' in u && 'chat_id' in u.message
}

function chatDebug(client: TelegramClient) {
    return function (...args: any[]) {
        if (process.env.chatDebug) {
            console.log(`[${(client as any).firstName}]`, ...args)
        }
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
