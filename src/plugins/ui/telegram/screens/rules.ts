import { Markup, Telegraf } from 'telegraf'
import L from '../../i18n/i18n-node'
import { toLocale } from '../../i18n/to-locale'

export function rulesScreen(bot: Telegraf) {
    bot.action('rules', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.apply
        const keyboard = Markup.inlineKeyboard(
            [
                Markup.button.callback(texts.buttons.onChief(), 'on-chief'),
                Markup.button.callback(texts.buttons.onShaman(), 'on-shaman'),
                Markup.button.callback(texts.buttons.next(), 'in-tribe'),
                Markup.button.callback(texts.buttons.start(), 'start'),
            ],
            { columns: 2 }
        )
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('on-chief', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.onChief
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.back(), 'rules'),
            Markup.button.callback(texts.buttons.start(), 'start'),
        ])
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('on-shaman', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.onShaman
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.back(), 'rules'),
            Markup.button.callback(texts.buttons.start(), 'start'),
        ])
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('in-tribe', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.inTribe
        const keyboard = Markup.inlineKeyboard(
            [
                Markup.button.callback(
                    texts.buttons.onBrainsotrm(),
                    'on-brainstorm'
                ),
                Markup.button.callback(texts.buttons.onQuests(), 'on-quest'),
                Markup.button.callback(texts.buttons.back(), 'rules'),
                Markup.button.callback(texts.buttons.start(), 'start'),
            ],
            { columns: 2 }
        )
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('on-brainstorm', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.onBrainsotrm
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.back(), 'in-tribe'),
            Markup.button.callback(texts.buttons.start(), 'start'),
        ])
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('on-quest', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].rules.onQuests
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.back(), 'in-tribe'),
            Markup.button.callback(texts.buttons.start(), 'start'),
        ])
        ctx.editMessageText(texts.text(), keyboard)
    })
    bot.action('start', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        
        const texts = L[l].start

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ])
        ctx.editMessageText(texts.text(), keyboard)
    })
}
