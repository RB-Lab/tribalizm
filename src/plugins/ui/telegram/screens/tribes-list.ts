import { Markup, Scenes, Telegraf } from 'telegraf'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { TribeInfo } from '../../../../use-cases/tribes-show'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'

function scenes() {
    const locationScene = new Scenes.BaseScene<TribeCtx>('set-location')

    locationScene.enter((ctx) => {
        const texts = i18n(ctx).tribesList

        const keyboard = Markup.keyboard([
            Markup.button.locationRequest(texts.requestLocation()),
        ])
            .oneTime()
            .resize()

        ctx.deleteMessage()
        ctx.reply(texts.requestLocationText(), keyboard)
    })

    locationScene.on('location', async (ctx) => {
        ;(ctx.scene.state as any).location = ctx.message.location
        const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
            coordinates: ctx.message.location,
            limit: 3,
        })
        showTribesList(ctx, tribes)
    })

    locationScene.on('text', async (ctx) => {
        const texts = i18n(ctx).tribesList
        ;(ctx.scene.state as any).citySearchString = ctx.message.text
        const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
            coordinates: null,
            citySearchString: ctx.message.text,
            limit: 3,
        })
        // remove "share location" button
        await ctx.reply(
            texts.searchIn({ city: ctx.message.text }),
            Markup.removeKeyboard()
        )
        showTribesList(ctx, tribes)
    })

    interface Ctx {
        replyWithHTML: (string: string, keyboard: any) => any
        from?: { language_code?: string }
    }

    function showTribesList(ctx: Ctx, tribes: TribeInfo[]) {
        const texts = i18n(ctx).tribesList

        tribes.forEach((tribe) => {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.apply(),
                    `apply-tribe:${tribe.id}`
                ),
            ])
            ctx.replyWithHTML(
                `<b>${tribe.name}</b> \n \n${
                    tribe.description
                }\n ${texts.count()} ${tribe.membersCount}`,
                keyboard
            )
        })
    }

    const applyTribeScene = new Scenes.BaseScene<TribeCtx>('apply-tribe')
    applyTribeScene.enter(async (ctx) => {
        const texts = i18n(ctx).tribesList
        const tribe = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId: (ctx.scene.state as any).tribeId,
        })
        ctx.reply(texts.applyText({ tribe: tribe.name }))
    })
    applyTribeScene.on('text', async (ctx) => {
        const texts = i18n(ctx).tribesList
        await ctx.tribalizm.tribeApplication.appyToTribe({
            coverLetter: ctx.message.text,
            tribeId: (ctx.scene.state as any).tribeId,
            userId: ctx.user.userId,
        })

        ctx.reply(texts.applicationSent())
        ctx.scene.leave()
    })

    return [locationScene, applyTribeScene]
}

function actions(bot: Telegraf<TribeCtx>) {
    bot.action('list-tribes', (ctx) => {
        ctx.scene.enter('set-location')
    })

    bot.action(/apply-tribe:+/, (ctx) => {
        const texts = i18n(ctx).tribesList
        ctx.editMessageText(
            // It thinks that it is ServiceMessage and it has no text, but it has
            (ctx.update.callback_query.message as any).text +
                '\n\n' +
                texts.applicationSentShort(),
            Markup.inlineKeyboard([])
        )
        // TODO 🤔 should I leave previeous scenen here?
        ctx.scene.enter('apply-tribe', {
            tribeId: ctx.match.input.replace('apply-tribe:', ''),
        })
    })
}
export const tribesListScreen = { scenes, actions }
