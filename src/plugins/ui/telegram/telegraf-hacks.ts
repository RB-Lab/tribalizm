import { Markup } from 'telegraf'

export class SceneState<S extends object> {
    get<K extends keyof S>(ctx: { scene: { state: any } }, key: K) {
        return ctx.scene.state[key] as S[K]
    }
    set<K extends keyof S>(
        ctx: { scene: { state: any } },
        key: K,
        value: S[K]
    ) {
        ctx.scene.state[key] = value
    }
}

export async function removeInlineKeyboard(ctx: any, replaceText?: string) {
    let text = ctx.update.callback_query.message.text
    if (replaceText) {
        text += `\n${replaceText}`
    }
    await ctx.editMessageText(text, Markup.inlineKeyboard([]))
}
