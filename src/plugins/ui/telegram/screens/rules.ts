import { Markup, Scenes, Telegraf } from 'telegraf'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'

function scenes() {
    const helpScene = new Scenes.BaseScene<Scenes.SceneContext>('help')

    helpScene.enter((ctx) => {
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
    helpScene.action('on-chief', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onChief(), keyboard)
    })
    helpScene.action('on-shaman', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'rules'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onShaman(), keyboard)
    })
    helpScene.action('in-tribe', (ctx) => {
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
    helpScene.action('on-brainstorm', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.inTribe(), keyboard)
    })
    helpScene.action('on-quest', (ctx) => {
        const btns = i18n(ctx).rules.buttons
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.back(), 'in-tribe'),
            Markup.button.callback(btns.start(), 'start'),
        ])
        ctx.editMessageText(i18n(ctx).rules.onQuests(), keyboard)
    })
    helpScene.action('start', (ctx) => {
        const btns = i18n(ctx).start.buttons

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(btns.list(), 'list-tribes'),
            Markup.button.callback(btns.rules(), 'rules'),
        ])
        ctx.editMessageText(i18n(ctx).start.text(), keyboard)
    })

    return [helpScene]
}

function actions(bot: Telegraf<TribeCtx>) {
    bot.action('rules', (ctx) => {
        ctx.scene.enter('help')
    })
}

export const rulesScreen = { scenes, actions }
