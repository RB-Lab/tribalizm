import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
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
        if (city) {
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
                via: 'location',
            })
            if (tribes.length) {
                return showTribesList(ctx, tribes)
            } else {
                return ctx.reply(texts.nothingFound({ city: city.name }))
            }
        }
        await ctx.user.setState<LocateState>({ type: 'locate-state' })

        const keyboard = Markup.keyboard([
            Markup.button.locationRequest(texts.requestLocation()),
        ])
            .oneTime()
            .resize()

        ctx.deleteMessage()
        ctx.reply(texts.requestLocationText(), keyboard)
    })

    bot.on('location', async (ctx, next) => {
        if (isLocateState(ctx.user.state)) {
            await ctx.user.setState(null)
            const texts = i18n(ctx).tribesList
            const city = await ctx.tribalizm.locateUser.locateUserByCoordinates(
                {
                    latitude: ctx.message.location.latitude,
                    longitude: ctx.message.location.longitude,
                    userId: ctx.user.userId,
                }
            )
            if (!city) {
                ctx.logEvent('No city found', {
                    via: 'location',
                    location: ctx.message.location,
                })
                ctx.reply(texts.cantFindCity())
                return
            }
            ctx.user.locate(city.id, city.timeZone)
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
                via: 'location',
            })
            if (tribes.length) {
                showTribesList(ctx, tribes)
            } else {
                ctx.reply(texts.nothingFound({ city: city.name }))
            }
        } else {
            return next()
        }
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (isLocateState(state)) {
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
                ctx.reply(texts.unknownCity())
                return
            }
            await ctx.user.setState(null)
            ctx.user.locate(city.id, city.timeZone)
            // remove "share location" button
            await ctx.reply(
                texts.searchIn({ city: ctx.message.text }),
                Markup.removeKeyboard()
            )
            const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
                limit: 3,
                userId: ctx.user.userId,
            })
            ctx.logEvent('Tribes list', {
                city,
                tribes: tribes.length,
                via: 'text',
            })
            if (tribes.length) {
                showTribesList(ctx, tribes)
            } else {
                ctx.reply(
                    texts.nothingFound({
                        city: ctx.message.text,
                    })
                )
            }
        } else if (isApplyState(state)) {
            const texts = i18n(ctx).tribesList
            ctx.logEvent('application', { tribeId: state.tribeId })
            await ctx.user.setState(null)
            await ctx.tribalizm.tribeApplication.applyToTribe({
                coverLetter: ctx.message.text,
                tribeId: state.tribeId,
                userId: ctx.user.userId,
            })

            ctx.reply(texts.applicationSent())
        } else {
            return next()
        }
    })

    const applyTribe = makeCallbackDataParser('apply-tribe', ['tribeId'])
    function showTribesList(ctx: TribeCtx, tribes: TribeInfo[]) {
        const texts = i18n(ctx).tribesList

        tribes.forEach((tribe) => {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.apply(),
                    applyTribe.serialize({ tribeId: tribe.id })
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
    bot.action(applyTribe.regex, async (ctx) => {
        const { tribeId } = applyTribe.parse(ctx.match.input)
        const texts = i18n(ctx).tribesList
        ctx.logEvent('apply tribe', { tribeId })
        ctx.user.setState<ApplyState>({ type: 'apply-state', tribeId })
        const tribe = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
        })
        removeInlineKeyboard(ctx, texts.applicationSentShort())
        ctx.reply(texts.applyText({ tribe: tribe.name }))
    })
}
