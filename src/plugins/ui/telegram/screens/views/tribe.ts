import { Markup } from 'telegraf'
import { ExtraPhoto, ExtraReplyMessage } from 'telegraf/typings/telegram-types'
import { TribeInfo } from '../../../../../use-cases/tribes-show'
import { i18n, Ctx } from '../../../i18n/i18n-ctx'
import { makeCallbackDataParser } from '../callback-parser'

export const applyTribe = makeCallbackDataParser('apply-tribe', [
    'tribeId',
    'isShort',
])

export const moreTribeInfo = makeCallbackDataParser('tribe-info', ['tribeId'])

export function tribeView(ctx: Ctx, tribeInfo: TribeInfo) {
    const texts = i18n(ctx).tribesList

    const text = `<b>${tribeInfo.name}</b>\n${tribeInfo.description}\n`

    const keys = []
    if (!tribeInfo.isInTribe) {
        keys.push(
            Markup.button.callback(
                texts.apply(),
                applyTribe.serialize({ tribeId: tribeInfo.id, isShort: false })
            )
        )
    }
    const keyboard = Markup.inlineKeyboard(keys)

    const extra = {
        reply_markup: keyboard.reply_markup,
        parse_mode: 'HTML' as 'HTML',
    }
    return { text, extra }
}

export function tribeViewShort(ctx: Ctx, tribeInfo: TribeInfo) {
    const texts = i18n(ctx).tribesList

    const text =
        `<b>${tribeInfo.name}</b>\n` +
        `${truncate(tribeInfo.description)}\n` +
        `<i>${texts.count()} ${tribeInfo.membersCount}</i>\n`

    const keyboard = Markup.inlineKeyboard([
        Markup.button.callback(
            texts.more(),
            moreTribeInfo.serialize({ tribeId: tribeInfo.id })
        ),
        Markup.button.callback(
            texts.apply(),
            applyTribe.serialize({ tribeId: tribeInfo.id, isShort: true })
        ),
    ])

    const extra = {
        reply_markup: keyboard.reply_markup,
        parse_mode: 'HTML' as 'HTML',
    }

    return { text, extra }
}

const maxLen = 55
function truncate(str: string) {
    const words = str.split(/\s+/)
    let result = ''
    for (let word of words) {
        if ((result + word).length > maxLen) return `${result}…`
        result += ' ' + word
    }
    return result
}
