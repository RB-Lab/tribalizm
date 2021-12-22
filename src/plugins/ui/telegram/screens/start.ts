import { Markup } from 'telegraf'
import { base64Decode } from '../../../../ts-utils'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'
import { tribeView } from './views/tribe'

export function startScreen({ bot }: TgContext) {
    const myTribes = makeCallbackDataParser('my-tribes', [])
    const showTribe = makeCallbackDataParser('trb-prf-info', ['tribeId'])
    const profile = makeCallbackDataParser('profile', [])

    bot.start(async (ctx) => {
        // always reset state when user re-starts bot
        await ctx.user.setState(null)

        const startTribe = ctx.message.text.replace(/\/start\s*/, '')
        if (startTribe) {
            const tribeId = base64Decode(startTribe).replace('tribe=', '')
            ctx.logEvent('/start', { tribeId })
            const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
                tribeId,
                userId: ctx.user.userId,
            })

            const view = tribeView(ctx, {
                tribeInfo,
                hasLink: tribeInfo.isInTribe,
                showHelp: ctx.firstTime,
            })
            if (tribeInfo.logo) {
                return ctx.telegram.sendPhoto(ctx.chat.id, tribeInfo.logo, {
                    caption: view.text,
                    ...view.extra,
                })
            } else {
                return ctx.reply(view.text, view.extra)
            }
        }
        ctx.logEvent('/start')
        const text = ctx.firstTime
            ? i18n(ctx).start.text()
            : i18n(ctx).start.profile()
        const keyboard = await getProfileButtons(ctx)
        return ctx.reply(text, Markup.inlineKeyboard(keyboard, { columns: 2 }))
    })

    async function getProfileButtons(ctx: TribeCtx) {
        const texts = i18n(ctx).start

        const keyboard = [
            Markup.button.callback(texts.buttons.list(), 'list-tribes'),
            Markup.button.callback(texts.buttons.rules(), 'rules'),
        ]
        const user = await ctx.viewModels.user.getUserInfo(ctx.user.userId)
        if (user.hasTribes) {
            keyboard.push(
                Markup.button.callback(
                    texts.buttons.myTribes(),
                    myTribes.serialize()
                )
            )
        }
        return keyboard
    }
    bot.action(profile.regex, async (ctx) => {
        ctx.logEvent('/start', { profile: true })
        const keyboard = await getProfileButtons(ctx)
        return ctx.editMessageText(
            i18n(ctx).start.profile(),
            Markup.inlineKeyboard(keyboard, { columns: 2 })
        )
    })

    bot.action(myTribes.regex, async (ctx) => {
        const tribes = await ctx.viewModels.user.getUserTribes(ctx.user.userId)
        const btns = tribes.map((t) =>
            Markup.button.callback(
                t.name,
                showTribe.serialize({ tribeId: t.id })
            )
        )
        btns.push(
            Markup.button.callback(
                i18n(ctx).buttons.back(),
                profile.serialize()
            )
        )

        if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
            return ctx.editMessageText(
                i18n(ctx).start.myTribes(),
                Markup.inlineKeyboard(btns, { columns: 1 })
            )
        }
        return Promise.all([
            ctx.reply(
                i18n(ctx).start.myTribes(),
                Markup.inlineKeyboard(btns, { columns: 1 })
            ),
            ctx.deleteMessage(),
        ])
    })

    bot.action(showTribe.regex, async (ctx) => {
        const { tribeId } = showTribe.parse(ctx.match.input)

        const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
            userId: ctx.user.userId,
        })
        const view = tribeView(ctx, {
            tribeInfo,
            back: myTribes.serialize(),
            hasLink: true,
        })
        if (tribeInfo.logo) {
            return Promise.all([
                ctx.deleteMessage(),
                ctx.replyWithPhoto(tribeInfo.logo, {
                    caption: view.text,
                    ...view.extra,
                }),
            ])
        }
        return ctx.editMessageText(view.text, view.extra)
    })
}
