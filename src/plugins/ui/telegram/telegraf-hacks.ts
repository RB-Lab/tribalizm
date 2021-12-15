import { Markup } from 'telegraf'
import { InlineKeyboardMarkup } from 'typegram'
import { TribeCtx } from './tribe-ctx'

export async function removeInlineKeyboard(
    ctx: TribeCtx,
    replacement?: string | Markup.Markup<InlineKeyboardMarkup>
) {
    let text = (ctx.update as any).callback_query.message.text
    let kb = Markup.inlineKeyboard([])
    if (replacement) {
        if (typeof replacement === 'string') {
            text += `\n${replacement}`
        } else {
            kb = replacement
        }
    }

    await ctx.editMessageText(text, kb)
}
