import { Markup } from 'telegraf'
import { hasPropertyValue, Maybe } from '../../../../ts-utils'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import { tribeView } from './views/tribe'

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
export const createTribe = makeCallbackDataParser('create-new-tribe', [])
export function createTribeScreen({ bot }: TgContext) {
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
