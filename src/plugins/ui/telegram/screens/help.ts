import { Markup } from 'telegraf'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'

export function helpScreen({ bot }: TgContext) {
    bot.action('rules', async (ctx) => {
        ctx.logEvent('help')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard(
            [
                Markup.button.callback(btns.onChief(), 'on-chief'),
                Markup.button.callback(btns.onShaman(), 'on-shaman'),
                Markup.button.callback(btns.next(), 'in-tribe'),
                Markup.button.callback(btns.onAstral(), 'on-astral'),
                Markup.button.callback(btns.start(), 'start'),
            ],
            { columns: 2 }
        )
        await ctx.editMessageText(i18n(ctx).rules.apply(), keyboard)
    })
    bot.action('on-chief', async (ctx) => {
        ctx.logEvent('help: on-chief')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        await ctx.editMessageText(i18n(ctx).rules.onChief(), keyboard)
    })
    bot.action('on-shaman', async (ctx) => {
        ctx.logEvent('help: on-shaman')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        await ctx.editMessageText(i18n(ctx).rules.onShaman(), keyboard)
    })
    bot.action('on-astral', async (ctx) => {
        ctx.logEvent('help: on-astral')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        await ctx.editMessageText(i18n(ctx).rules.onAstral(), keyboard)
    })
    bot.action('in-tribe', async (ctx) => {
        ctx.logEvent('help: in-tribe')
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
        await ctx.editMessageText(i18n(ctx).rules.inTribe(), keyboard)
    })
    bot.action('on-brainstorm', async (ctx) => {
        ctx.logEvent('help: on-brainstorm')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        await ctx.editMessageText(i18n(ctx).rules.onBrainstorm(), keyboard)
    })
    bot.action('on-quest', async (ctx) => {
        ctx.logEvent('help: on-quest')
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        await ctx.editMessageText(i18n(ctx).rules.onQuests(), keyboard)
    })
    bot.action('start', async (ctx) => {
        ctx.logEvent('help: start')
        const btns = i18n(ctx).start.buttons

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.list(), 'list-tribes'),
            Markup.button.callback(btns.rules(), 'rules'),
        ])
        await ctx.editMessageText(i18n(ctx).start.text(), keyboard)
    })

    bot.action(helpTopic.regex, async (ctx) => {
        const topic = helpTopic.parse(ctx.match.input).topic
        ctx.logEvent('help', { topic })
        await ctx.answerCbQuery()
        switch (topic) {
            case 'charisma':
                return ctx.reply(i18n(ctx).help.charisma())
            case 'wisdom':
                return ctx.reply(i18n(ctx).help.wisdom())
            case 'tribalizm':
                return ctx.reply(i18n(ctx).help.whatIsTribalizmText())
            default:
                return ctx.reply(i18n(ctx).help.unknown())
        }
    })

    return [bot]
}

export const helpTopic = makeCallbackDataParser('help-topic', ['topic'])
