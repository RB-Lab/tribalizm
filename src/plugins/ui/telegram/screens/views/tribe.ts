import { Markup } from 'telegraf'
import { base64Encode } from '../../../../../ts-utils'
import { TribeInfo } from '../../../../../use-cases/tribes-show'
import { Ctx, i18n } from '../../../i18n/i18n-ctx'
import { TribeCtx } from '../../tribe-ctx'
import { makeCallbackDataParser } from '../callback-parser'
import { helpTopic } from '../help'

export const applyTribe = makeCallbackDataParser('apply-tribe', [
    'tribeId',
    'isShort',
])

export const moreTribeInfo = makeCallbackDataParser('tribe-info', ['tribeId'])

interface TribeViewProps {
    tribeInfo: TribeInfo
    hasLink?: boolean
    back?: string
    showHelp?: boolean
}

// TODO [now] for first time user show "what is tribalizm button"
export function tribeView(ctx: TribeCtx, props: TribeViewProps) {
    const texts = i18n(ctx).tribesList

    let text = `<b>${props.tribeInfo.name}</b>\n\n${props.tribeInfo.description}\n\n`
    if (props.hasLink) {
        const tribeId = base64Encode(`tribe=${props.tribeInfo.id}`)
        const href = `https://t.me/${ctx.botInfo.username}?start=${tribeId}`
        text += `\n<a href="${href}"><b>${texts.joinLink()}</b></a>\n`
    }

    const keys = []
    if (props.back) {
        keys.push(Markup.button.callback(i18n(ctx).buttons.back(), props.back))
    }
    if (!props.tribeInfo.isInTribe) {
        keys.push(
            Markup.button.callback(
                texts.apply(),
                applyTribe.serialize({
                    tribeId: props.tribeInfo.id,
                    isShort: false,
                })
            )
        )
    }
    if (props.showHelp) {
        keys.push(
            Markup.button.callback(
                i18n(ctx).help.whatIsTribalizm(),
                helpTopic.serialize({ topic: 'tribalizm' })
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
