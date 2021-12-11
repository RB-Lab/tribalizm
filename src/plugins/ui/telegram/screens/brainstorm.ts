import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { NewIdeaMessage } from '../../../../use-cases/add-idea'
import { TimeToStormMessage } from '../../../../use-cases/admin'
import {
    BrainstormDeclarationMessage,
    BrainstormNoticeMessage,
    BrainstormStartedMessage,
    StormEndedMessage,
    VotingStartedMessage,
} from '../../../../use-cases/brainstorm-lifecycle'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
import tz from 'timezone-name-offsets'

const startBrainstorm = makeCallbackDataParser('storm-start', ['memberId'])

interface BrainstormState extends UserState {
    type: 'brainstorm'
    memberId: string
    brainstormId: string
}
function isBrainstormState(state: Maybe<UserState>): state is BrainstormState {
    return notEmpty(state) && state.type === 'brainstorm'
}

const voteParser = makeCallbackDataParser('vote-idea', [
    'brainstormId',
    'memberId',
    'ideaId',
    'vote',
])

const stormConfirm = makeCallbackDataParser('storm-confirm', [
    'memberId',
    'time',
])

export function brainstormScreen({
    bot,
    bus,
    tgUsers,
    messageStore,
}: TgContext) {
    bot.action(startBrainstorm.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { memberId } = startBrainstorm.parse(ctx.match[0])
        const onDateSet = (date: Date, ctxIn: TribeCtx) => {
            ctxIn.editMessageText(
                texts.confirmPrompt({ date }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.confirm(),
                        stormConfirm.serialize({
                            memberId,
                            time: ctx.user.convertTime(date).getTime(),
                        })
                    ),
                    Markup.button.callback(
                        texts.edit(),
                        startBrainstorm.serialize({ memberId })
                    ),
                ])
            )
        }
        ctx.reply(
            texts.proposeDate(),
            ctx.getCalendar(onDateSet, ctx.from?.language_code)
        )
    })
    bot.action(stormConfirm.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { memberId, time } = stormConfirm.parse(ctx.match[0])
        ctx.logEvent('storm: crate', { time })
        await ctx.tribalizm.brainstormLifecycle.declare({
            memberId,
            time: Number(time),
        })
        // remove buttons
        ctx.editMessageText(
            texts.confirmPrompt({ date: new Date(Number(time)) }),
            Markup.inlineKeyboard([])
        )
        ctx.reply(texts.done())
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (isBrainstormState(state)) {
            ctx.logEvent('storm: idea', {
                idea: ctx.message.text,
                stormId: state.brainstormId,
            })
            await ctx.tribalizm.addIdea.addIdea({
                brainstormId: state.brainstormId,
                memberId: state.memberId,
                description: ctx.message.text,
            })
        } else {
            return next()
        }
    })

    bot.action(voteParser.regex, async (ctx) => {
        const data = voteParser.parse(ctx.match[0])
        ctx.logEvent('storm: vote', {
            ideaId: data.ideaId,
            stormId: data.brainstormId,
        })

        if (data.vote === 'up') {
            await ctx.tribalizm.voting.voteUp(data.ideaId, data.memberId)
        } else {
            await ctx.tribalizm.voting.voteDown(data.ideaId, data.memberId)
        }
        await removeInlineKeyboard(ctx)
    })

    // ======== Handle Notifications =========

    bus.subscribe<TimeToStormMessage>('time-to-storm', async ({ payload }) => {
        const user = await tgUsers.getTelegramUserForTribalism(
            payload.targetUserId
        )
        const texts = i18n(user).brainstorm
        await bot.telegram.sendMessage(
            user.chatId,
            texts.timeToStorm(),
            Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.toStormButton(),
                    startBrainstorm.serialize({
                        memberId: payload.targetMemberId,
                    })
                ),
            ])
        )
    })
    bus.subscribe<BrainstormDeclarationMessage>(
        'new-brainstorm',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            await bot.telegram.sendMessage(
                user.chatId,
                texts.brainstormDeclared({ date: new Date(payload.time) })
            )
        }
    )
    bus.subscribe<BrainstormNoticeMessage>(
        'brainstorm-notice',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            await bot.telegram.sendMessage(
                user.chatId,
                texts.brainstormNotice({ date: new Date(payload.time) })
            )
        }
    )
    bus.subscribe<BrainstormStartedMessage>(
        'brainstorm-started',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            await user.setState<BrainstormState>({
                type: 'brainstorm',
                brainstormId: payload.brainstormId,
                memberId: payload.targetMemberId,
            })
            await bot.telegram.sendMessage(user.chatId, texts.started())
        }
    )
    bus.subscribe<NewIdeaMessage>('new-idea-added', async ({ payload }) => {
        const user = await tgUsers.getTelegramUserForTribalism(
            payload.targetUserId
        )

        const message = await bot.telegram.sendMessage(
            user.chatId,
            `➡️ ${payload.description}`
        )
        messageStore.save({
            messageId: message.message_id,
            chatId: user.chatId,
            brainstormId: payload.brainstormId,
            ideaId: payload.ideaId,
            text: message.text,
        })
    })

    bus.subscribe<VotingStartedMessage>(
        'voting-started',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const messages = await messageStore.find({
                brainstormId: payload.brainstormId,
                chatId: user.chatId,
            })
            await user.setState(null)

            for (let message of messages) {
                const kb = Markup.inlineKeyboard([
                    Markup.button.callback(
                        '👍',
                        voteParser.serialize({
                            brainstormId: payload.brainstormId,
                            ideaId: message.ideaId,
                            memberId: payload.targetMemberId,
                            vote: 'up',
                        })
                    ),
                    Markup.button.callback(
                        '👎',
                        voteParser.serialize({
                            brainstormId: payload.brainstormId,
                            ideaId: message.ideaId,
                            memberId: payload.targetMemberId,
                            vote: 'down',
                        })
                    ),
                ])

                await bot.telegram.editMessageText(
                    user.chatId,
                    Number(message.messageId),
                    undefined,
                    message.text,
                    kb
                )
            }
            await bot.telegram.sendMessage(
                user.chatId,
                i18n(user).brainstorm.toVote()
            )
        }
    )

    bus.subscribe<StormEndedMessage>(
        'brainstorm-ended',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )

            await bot.telegram.sendMessage(
                user.chatId,
                i18n(user).brainstorm.end()
            )
        }
    )
}
