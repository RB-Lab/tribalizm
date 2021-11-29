import { Context, Markup, Telegraf } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { NewIdeaMessage } from '../../../../use-cases/add-idea'
import { TimeToStormMessage } from '../../../../use-cases/admin'
import {
    BrainstormDeclarationMessage,
    BrainstormNoticeMessage,
    BrainstormStartedMessage,
    StormEndeddMessage,
    VotingStartedMessage,
} from '../../../../use-cases/brainstorm-lifecycle'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { InMemoryStore } from '../../../stores/in-memory-store/in-memory-store'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter, UserState } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

const startBrst = makeCalbackDataParser('storm-start', ['memberId'])

interface Message {
    brainstormId: string
    chatId: string
    messageId: number
    text: string
    ideaId: string
}

// TODO user real store here!!!
const messageStore = new InMemoryStore<Message>()

interface BrainstormState extends UserState {
    type: 'brainstorm'
    memberId: string
    brainstormId: string
}
function isBarinstormState(state: Maybe<UserState>): state is BrainstormState {
    return notEmpty(state) && state.type === 'brainstorm'
}
function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<TimeToStormMessage>('time-to-storm', async ({ payload }) => {
        const user = await telegramUsers.getTelegramUserForTribalism(
            payload.targetUserId
        )
        const texts = i18n(user).brainstorm
        bot.telegram.sendMessage(
            user.chatId,
            texts.timeToStorm(),
            Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.toStormButton(),
                    startBrst.serialize({ memberId: payload.targetMemberId })
                ),
            ])
        )
    })
    bus.subscribe<BrainstormDeclarationMessage>(
        'new-brainstorm',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            bot.telegram.sendMessage(
                user.chatId,
                texts.brainstormDeclared({ date: new Date(payload.time) })
            )
        }
    )
    bus.subscribe<BrainstormNoticeMessage>(
        'brainstorm-notice',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            bot.telegram.sendMessage(
                user.chatId,
                texts.brainstormNotice({ date: new Date(payload.time) })
            )
        }
    )
    bus.subscribe<BrainstormStartedMessage>(
        'brainstorm-started',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).brainstorm
            await user.setState<BrainstormState>({
                type: 'brainstorm',
                brainstormId: payload.brainstormId,
                memberId: payload.targetMemberId,
            })
            bot.telegram.sendMessage(user.chatId, texts.started())
        }
    )
    bus.subscribe<NewIdeaMessage>('new-idea-added', async ({ payload }) => {
        const user = await telegramUsers.getTelegramUserForTribalism(
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
            const user = await telegramUsers.getTelegramUserForTribalism(
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
            bot.telegram.sendMessage(
                user.chatId,
                i18n(user).brainstorm.toVote()
            )
        }
    )

    bus.subscribe<StormEndeddMessage>(
        'brainstorm-ended',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )

            await bot.telegram.sendMessage(
                user.chatId,
                i18n(user).brainstorm.end()
            )
        }
    )
}

const voteParser = makeCalbackDataParser('vote-idea', [
    'brainstormId',
    'memberId',
    'ideaId',
    'vote',
])

const stormConfirm = makeCalbackDataParser('storm-confirm', [
    'memberId',
    'time',
])

function actions(bot: Telegraf<TribeCtx>) {
    bot.action(startBrst.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { memberId } = startBrst.parse(ctx.match[0])
        const onDateSet = (date: Date, ctxIn: TribeCtx) => {
            ctxIn.editMessageText(
                texts.confirmPrompt({ date }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.confirm(),
                        stormConfirm.serialize({
                            memberId,
                            time: date.getTime(),
                        })
                    ),
                    Markup.button.callback(
                        texts.edit(),
                        startBrst.serialize({ memberId })
                    ),
                ])
            )
        }
        ctx.reply(
            texts.proposeDate(),
            ctx.getCalenar(onDateSet, ctx.from?.language_code)
        )
    })
    bot.action(stormConfirm.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { memberId, time } = stormConfirm.parse(ctx.match[0])
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
        if (isBarinstormState(state)) {
            await ctx.tribalizm.addIdea.addIdea({
                brainstormId: state.brainstormId,
                memberId: state.memberId,
                description: ctx.message.text,
            })
        } else {
            next()
        }
    })

    bot.action(voteParser.regex, async (ctx) => {
        const data = voteParser.parse(ctx.match[0])

        if (data.vote === 'up') {
            await ctx.tribalizm.voting.voteUp(data.ideaId, data.memberId)
        } else {
            await ctx.tribalizm.voting.voteDown(data.ideaId, data.memberId)
        }
        await removeInlineKeyboard(ctx)
    })
}

export const brainstormScreen = { actions, attachNotifications }
