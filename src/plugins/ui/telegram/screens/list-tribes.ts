import { Markup } from 'telegraf'
import { hasPropertyValue, Maybe, notEmpty } from '../../../../ts-utils'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import {
    applyTribe,
    moreTribeInfo,
    tribeView,
    tribeViewShort,
} from './views/tribe'

interface LocateState extends UserState {
    type: 'locate-state'
}
function isLocateState(state: Maybe<UserState>): state is LocateState {
    return notEmpty(state) && state.type === 'locate-state'
}
interface ApplyState extends UserState {
    type: 'apply-state'
    tribeId: string
}
function isApplyState(state: Maybe<UserState>): state is ApplyState {
    return notEmpty(state) && state.type === 'apply-state'
}

export function listTribesScreen({ bot }: TgContext) {
    bot.action('list-tribes', async (ctx) => {
        ctx.logEvent('list tribes')
        const texts = i18n(ctx).tribesList
        const city =
            ctx.user.cityId &&
            (await ctx.tribalizm.tribesShow.getCityInfo(ctx.user.cityId))

        removeInlineKeyboard(ctx)

        if (city) {
            return showCityTribesList(ctx, city, 'saved city')
        }
        await ctx.user.setState<LocateState>({ type: 'locate-state' })

        const keyboard = Markup.keyboard([
            Markup.button.locationRequest(texts.requestLocation()),
        ])
            .oneTime()
            .resize()

        await ctx.reply(texts.requestLocationText(), keyboard)
    })
    bot.action(moreTribeInfo.regex, async (ctx) => {
        const { tribeId } = moreTribeInfo.parse(ctx.match.input)
        const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
        })
        ctx.logEvent('Tribe info', {
            tribeId: tribeInfo.id,
            tribeName: tribeInfo.name,
        })

        await ctx.deleteMessage()
        const view = tribeView(ctx, { tribeInfo })
        if (tribeInfo.logo) {
            if (!ctx.chat) {
                throw new Error('WTF, context has no chat')
            }
            await ctx.telegram.sendPhoto(ctx.chat.id, tribeInfo.logo, {
                caption: view.text,
                ...view.extra,
            })
        } else {
            await ctx.reply(view.text, view.extra)
        }
    })

    bot.on('location', async (ctx, next) => {
        if (!isLocateState(ctx.user.state)) {
            return next()
        }
        await ctx.user.setState(null)
        const texts = i18n(ctx).tribesList
        const city = await ctx.tribalizm.locateUser.locateUserByCoordinates({
            latitude: ctx.message.location.latitude,
            longitude: ctx.message.location.longitude,
            userId: ctx.user.userId,
        })
        if (!city) {
            ctx.logEvent('No city found', {
                via: 'location',
                location: ctx.message.location,
            })
            await ctx.reply(texts.cantFindCity())
            return
        }
        await ctx.user.locate(city.id, city.timeZone)
        await showCityTribesList(ctx, city, 'location')
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (!isLocateState(state)) {
            return next()
        }
        const texts = i18n(ctx).tribesList
        const city = await ctx.tribalizm.locateUser.locateUserByCityName({
            cityName: ctx.message.text,
            userId: ctx.user.userId,
        })
        if (!city) {
            ctx.logEvent('No city found', {
                via: 'text',
                location: ctx.message.text,
            })
            await ctx.reply(texts.unknownCity())
            return
        }
        await ctx.user.setState(null)
        await ctx.user.locate(city.id, city.timeZone)
        await showCityTribesList(ctx, city, 'city name')
    })

    const searchAstral = makeCallbackDataParser('search-astral', ['after'])
    async function showCityTribesList(
        ctx: TribeCtx,
        city: { name: string },
        via: string
    ) {
        const texts = i18n(ctx).tribesList

        const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
            limit: 3,
            userId: ctx.user.userId,
        })
        await ctx.reply(
            texts.searchIn({ city: city.name }),
            Markup.removeKeyboard()
        )
        ctx.logEvent('Tribes list', {
            city,
            tribes: tribes.length,
            via,
        })
        if (!tribes.length) {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.searchAstral(),
                    searchAstral.serialize()
                ),
            ])
            return ctx.reply(texts.nothingFound({ city: city.name }), keyboard)
        }
        for (let tribe of tribes) {
            const view = tribeViewShort(ctx, tribe)
            await ctx.reply(view.text, view.extra)
        }
    }

    bot.action(applyTribe.regex, async (ctx) => {
        const { tribeId, isShort } = applyTribe.parse(ctx.match.input)
        const texts = i18n(ctx).tribesList
        ctx.logEvent('apply tribe', { tribeId })
        await ctx.user.setState<ApplyState>({ type: 'apply-state', tribeId })
        const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
        })

        const view = isShort
            ? tribeViewShort(ctx, tribeInfo)
            : tribeView(ctx, { tribeInfo })
        const msg = ctx.update.callback_query.message
        const extra = {
            parse_mode: 'HTML' as 'HTML',
            reply_markup: { inline_keyboard: [] },
        }
        const text = `${view.text} ${texts.applicationSentShort()}`
        if (msg && 'caption' in msg) {
            await ctx.editMessageCaption(text, extra)
        } else {
            await ctx.editMessageText(text, extra)
        }

        return ctx.reply(texts.applyText({ tribe: tribeInfo.name }))
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state

        if (!isApplyState(state)) {
            return next()
        }
        const texts = i18n(ctx).tribesList
        ctx.logEvent('application', { tribeId: state.tribeId })
        await ctx.user.setState(null)
        await ctx.tribalizm.tribeApplication.applyToTribe({
            coverLetter: ctx.message.text,
            tribeId: state.tribeId,
            userId: ctx.user.userId,
        })

        await ctx.reply(texts.applicationSent())
    })

    bot.action(searchAstral.regex, async (ctx) => {
        const texts = i18n(ctx).tribesList
        const after = searchAstral.parse(ctx.match.input)
        ctx.logEvent('search astral', after)

        await removeInlineKeyboard(ctx)
        const tribes = await ctx.tribalizm.tribesShow.getAstralTribes({
            limit: 3,
            after: after.after,
            userId: ctx.user.userId,
        })
        ctx.logEvent('Tribes list', {
            city: 'Astral',
            tribes: tribes.length,
            via: 'Astral',
        })
        const createKb = Markup.inlineKeyboard([
            Markup.button.callback(
                texts.createTribe(),
                createTribe.serialize()
            ),
        ])
        if (!tribes.length) {
            return ctx.reply(texts.noTribesInAstral(), createKb)
        }
        if (!after.after) {
            await ctx.reply(texts.searchInAstral())
        } else {
            await ctx.deleteMessage()
        }
        for (let tribe of tribes) {
            const view = tribeViewShort(ctx, tribe)
            await ctx.reply(view.text, view.extra)
        }
        // TODO make proper pagination with `hasNext` property
        //      and `loadMore` button rendered with `apply`
        if (tribes.length === 3) {
            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.loadMore(),
                    searchAstral.serialize({ after: tribes[2].id })
                ),
            ])
            return ctx.reply(texts.thereMore(), kb)
        }
        return ctx.reply(texts.tribeListEnd(), createKb)
    })

    // ==== CREATE tribes === //
    interface CreateTribeState {
        type: 'create-tribe-state'
        name?: string
        description?: string
        logo?: string
        messageId?: number
    }
    function isCreateTribeState(
        state: Maybe<UserState>
    ): state is CreateTribeState {
        return hasPropertyValue(state, 'type', 'create-tribe-state')
    }
    const createTribe = makeCallbackDataParser('create-new-tribe', [])

    bot.action(createTribe.regex, async (ctx) => {
        await ctx.user.setState<CreateTribeState>({
            type: 'create-tribe-state',
        })
        removeInlineKeyboard(ctx)
        return ctx.reply(i18n(ctx).tribesList.tribeNamePrompt())
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state

        if (!isCreateTribeState(state)) {
            return next()
        }
        const texts = i18n(ctx).tribesList
        if (!state.name) {
            await ctx.user.setState<CreateTribeState>({
                ...state,
                name: ctx.message.text,
            })
            return ctx.reply(texts.tribeDescriptionPrompt())
        }
        const kb = Markup.inlineKeyboard([
            Markup.button.callback(texts.skipImage(), skipLogo.serialize()),
        ])
        const msg = await ctx.reply(texts.uploadLogo(), kb)

        await ctx.user.setState<CreateTribeState>({
            ...state,
            messageId: msg.message_id,
            description: ctx.message.text,
        })
    })

    const skipLogo = makeCallbackDataParser('skip-tribe-logo', [])
    bot.action(skipLogo.regex, async (ctx, next) => {
        const state = ctx.user.state
        const texts = i18n(ctx).tribesList

        await removeInlineKeyboard(ctx)
        if (!isCreateTribeState(state)) {
            return next()
        }
        if (!state.name) {
            return ctx.reply(texts.tribeNamePrompt())
        }
        if (!state.description) {
            return ctx.reply(texts.tribeDescriptionPrompt())
        }

        ctx.logEvent('create tribe', {
            name: state.name,
            description: state.description,
        })
        await ctx.user.setState(null)

        const tribeId = await ctx.tribalizm.tribeCreation.createTribe({
            userId: ctx.user.userId,
            name: state.name,
            description: state.description,
        })
        await ctx.reply(texts.tribeCreated())
        const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
            userId: ctx.user.userId,
        })
        const view = tribeView(ctx, { tribeInfo, hasLink: true })
        return ctx.reply(view.text, view.extra)
    })

    bot.on('photo', async (ctx, next) => {
        const state = ctx.user.state
        const texts = i18n(ctx).tribesList

        if (!isCreateTribeState(state)) {
            return next()
        }
        if (state.messageId) {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                state.messageId,
                undefined,
                texts.uploadLogo(),
                Markup.inlineKeyboard([])
            )
        }
        if (!state.name) {
            return ctx.reply(texts.tribeNamePrompt())
        }
        if (!state.description) {
            return ctx.reply(texts.tribeDescriptionPrompt())
        }
        // let's get the biggest photo id
        let photoId
        let max = 0
        for (let file of ctx.message.photo) {
            if (file.width > max) {
                max = file.width
                photoId = file.file_id
            }
        }
        ctx.logEvent('create tribe', {
            name: state.name,
            description: state.description,
        })
        await ctx.user.setState(null)
        const tribeId = await ctx.tribalizm.tribeCreation.createTribe({
            userId: ctx.user.userId,
            logo: photoId,
            name: state.name,
            description: state.description,
        })
        await ctx.reply(texts.tribeCreated())
        const tribeInfo = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
            userId: ctx.user.userId,
        })
        const view = tribeView(ctx, { tribeInfo, hasLink: true })
        return ctx.replyWithPhoto(tribeInfo.logo, {
            caption: view.text,
            ...view.extra,
        })
    })
}
