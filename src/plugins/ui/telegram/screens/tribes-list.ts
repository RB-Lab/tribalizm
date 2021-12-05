import { Markup, Telegraf } from 'telegraf'
import { text } from 'telegraf/typings/button'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { TribeInfo } from '../../../../use-cases/tribes-show'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TribeCtx } from '../tribe-ctx'
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

export function tribesListScreen(bot: Telegraf<TribeCtx>) {
    bot.action('list-tribes', async (ctx) => {
        const texts = i18n(ctx).tribesList
        // TODO check if city already set
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
            const texts = i18n(ctx).tribesList
            const city = await ctx.tribalizm.locateUser.locateUserByCoordinates(
                {
                    latitude: ctx.message.location.latitude,
                    longitude: ctx.message.location.longitude,
                    userId: ctx.user.userId,
                }
            )
            if (!city) {
                ctx.reply(texts.cantFindCity())
                return
            }
            await ctx.reply(texts.searchIn({ city }), Markup.removeKeyboard())
            const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
                limit: 3,
                userId: ctx.user.userId,
            })
            if (tribes.length) {
                showTribesList(ctx, tribes)
            } else {
                ctx.reply(texts.nothingFound({ city }))
            }
            ctx.user.setState(null)
        } else {
            next()
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
                ctx.reply(texts.unknownCity())
            }
            // remove "share location" button
            await ctx.reply(
                texts.searchIn({ city: ctx.message.text }),
                Markup.removeKeyboard()
            )
            const tribes = await ctx.tribalizm.tribesShow.getLocalTribes({
                limit: 3,
                userId: ctx.user.userId,
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
            ctx.user.setState(null)
        } else if (isApplyState(state)) {
            const texts = i18n(ctx).tribesList
            await ctx.tribalizm.tribeApplication.applyToTribe({
                coverLetter: ctx.message.text,
                tribeId: state.tribeId,
                userId: ctx.user.userId,
            })

            ctx.reply(texts.applicationSent())
            ctx.user.setState(null)
        } else {
            next()
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

        ctx.user.setState<ApplyState>({ type: 'apply-state', tribeId })
        const tribe = await ctx.tribalizm.tribesShow.getTribeInfo({
            tribeId,
        })
        removeInlineKeyboard(ctx, texts.applicationSentShort())
        ctx.reply(texts.applyText({ tribe: tribe.name }))
    })
}
