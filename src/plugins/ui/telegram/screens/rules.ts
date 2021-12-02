import { Markup, Scenes, Telegraf } from 'telegraf'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'

export function rulesScreen(bot: Telegraf<TribeCtx>) {
    bot.action('rules', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard(
            [
                Markup.button.callback(btns.onChief(), 'on-chief'),
                Markup.button.callback(btns.onShaman(), 'on-shaman'),
                Markup.button.callback(btns.next(), 'in-tribe'),
                Markup.button.callback(btns.start(), 'start'),
            ],
            { columns: 2 }
        )
        ctx.editMessageText(i18n(ctx).rules.apply(), keyboard)
    })
    bot.action('on-chief', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onChief(), keyboard)
    })
    bot.action('on-shaman', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onShaman(), keyboard)
    })
    bot.action('in-tribe', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard(
            [
                Markup.button.callback(btns.onBrainstorm(), 'on-brainstorm'),
                Markup.button.callback(btns.onQuests(), 'on-quest'),
                Markup.button.callback(btns.back(), 'rules'),
                Markup.button.callback(btns.start(), 'start'),
            ],
            { columns: 2 }
        )
        ctx.editMessageText(i18n(ctx).rules.inTribe(), keyboard)
    })
    bot.action('on-brainstorm', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onBrainstorm(), keyboard)
    })
    bot.action('on-quest', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onQuests(), keyboard)
    })
    bot.action('start', (ctx) => {
        const btns = i18n(ctx).start.buttons

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.list(), 'list-tribes'),
            Markup.button.callback(btns.rules(), 'rules'),
        ])
        ctx.editMessageText(i18n(ctx).start.text(), keyboard)
    })

    return [bot]
}
