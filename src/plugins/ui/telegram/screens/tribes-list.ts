import { Markup } from 'telegraf'
import e from 'telegram-test-api/node_modules/@types/express'
import { hasPropertyValue, Maybe, notEmpty } from '../../../../ts-utils'
import { TribeInfo } from '../../../../use-cases/tribes-show'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'

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

export function tribesListScreen({ bot }: TgContext) {
    bot.action('list-tribes', async (ctx) => {
        ctx.logEvent('list tribes')
        const texts = i18n(ctx).tribesList
        const city =
            ctx.user.cityId &&
            (await ctx.tribalizm.tribesShow.getCityInfo(ctx.user.cityId))

        removeInlineKeyboard(
            ctx,
            Markup.inlineKeyboard([
                Markup.button.callback(
                    i18n(ctx).start.buttons.rules(),
                    'rules'
                ),
            ])
        )

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

    const applyTribe = makeCallbackDataParser('apply-tribe', ['tribeId'])
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
        return showTribes(ctx, tribes)
    }

    async function showTribes(ctx: TribeCtx, tribes: TribeInfo[]) {
        const texts = i18n(ctx).tribesList

        for (let tribe of tribes) {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.apply(),
                    applyTribe.serialize({ tribeId: tribe.id })
                ),
            ])
            await ctx.replyWithHTML(
                `<b>${tribe.name}</b>\n${
                    tribe.description
                }\n <i>${texts.count()} ${tribe.membersCount}</i>`,
                keyboard
            )
        }
    }

    bot.action(applyTribe.regex, async (ctx) => {
        const { tribeId } = applyTribe.parse(ctx.match.input)
        const texts = i18n(ctx).tribesList
        ctx.logEvent('apply tribe', { tribeId })
        await ctx.user.setState<ApplyState>({ type: 'apply-state', tribeId })
        const tribe = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
        })
        await removeInlineKeyboard(ctx, texts.applicationSentShort())
        await ctx.reply(texts.applyText({ tribe: tribe.name }))
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

    interface CreateTribeState {
        type: 'create-tribe-state'
        name?: string
    }
    function isCreateTribeState(
        state: Maybe<UserState>
    ): state is CreateTribeState {
        return hasPropertyValue(state, 'type', 'create-tribe-state')
    }
    const createTribe = makeCallbackDataParser('create-new-tribe', [])
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
        await showTribes(ctx, tribes)
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
        const description = ctx.message.text
        ctx.logEvent('create tribe', { name: state.name, description })
        await ctx.user.setState(null)
        await ctx.tribalizm.tribeCreation.createTribe({
            userId: ctx.user.userId,
            name: state.name,
            description,
        })
        return ctx.reply(texts.tribeCreated())
    })
}
