import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { NewIdeaMessage } from '../../../../use-cases/add-idea'
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

interface BrainstormState extends UserState {
    type: 'brainstorm'
    memberId: string
    brainstormId: string
}
function isBrainstormState(state: Maybe<UserState>): state is BrainstormState {
    return notEmpty(state) && state.type === 'brainstorm'
}

const voteParser = makeCallbackDataParser('vote-idea', ['ideaId', 'vote'])

export function brainstormScreen({
    bot,
    bus,
    tgUsers,
    messageStore,
}: TgContext) {
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
            idea: (ctx.message as any)?.text,
            vote: data.vote,
        })

        if (data.vote === 'up') {
            await ctx.tribalizm.voting.voteUp(data.ideaId, ctx.user.userId)
        } else {
            await ctx.tribalizm.voting.voteDown(data.ideaId, ctx.user.userId)
        }
        await removeInlineKeyboard(ctx)
    })

    // ======== Handle Notifications =========
    bus.subscribe<BrainstormDeclarationMessage>(
        'new-brainstorm',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            await bot.telegram.sendMessage(
                user.chatId,
                texts.brainstormDeclared({
                    date: user.toUserTime(new Date(payload.time)),
                })
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
                texts.brainstormNotice({
                    date: user.toUserTime(new Date(payload.time)),
                })
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
            const messages = await messageStore.findSimple({
                brainstormId: payload.brainstormId,
                chatId: user.chatId,
            })
            await user.setState(null)

            for (let message of messages) {
                const kb = Markup.inlineKeyboard([
                    Markup.button.callback(
                        '👍',
                        voteParser.serialize({
                            ideaId: message.ideaId,
                            vote: 'up',
                        })
                    ),
                    Markup.button.callback(
                        '👎',
                        voteParser.serialize({
                            ideaId: message.ideaId,
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
