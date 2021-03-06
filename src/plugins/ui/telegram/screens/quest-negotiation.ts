import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { QuestType } from '../../../../use-cases/entities/quest'
import {
    QuestAcceptedMessage,
    QuestChangeMessage,
} from '../../../../use-cases/negotiate-quest'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'

export const negotiate = makeCallbackDataParser('negotiate-quest', ['questId'])

const agreeQuest = makeCallbackDataParser('agree-quest', [
    'questId',
    'memberId',
])
const confirmProposal = makeCallbackDataParser('confirm-proposal', [])

interface NegotiationState extends UserState {
    type: 'negotiation-state'
    questId: string
    date?: Date
    place?: string
}
function isNegotiationState(
    state: Maybe<UserState>
): state is NegotiationState {
    return notEmpty(state) && state.type === 'negotiation-state'
}

export function questNegotiationScreen({ bot, bus, tgUsers }: TgContext) {
    bot.action(negotiate.regex, async (ctx) => {
        const { questId } = negotiate.parse(ctx.match[0])
        const texts = i18n(ctx).questNegotiation
        await ctx.user.setState<NegotiationState>({
            type: 'negotiation-state',
            questId,
        })
        await removeInlineKeyboard(ctx)
        await ctx.reply(
            texts.proposeDate(),
            ctx.getCalendar(onDateSet, ctx.from?.language_code)
        )
    })

    async function onDateSet(date: Date, ctx: TribeCtx) {
        const state = ctx.user.state
        if (isNegotiationState(state)) {
            state.date = date
            await ctx.user.setState(state)
            const texts = i18n(ctx).questNegotiation
            await ctx.editMessageText(
                texts.proposePlace(),
                Markup.inlineKeyboard([])
            )
        }
    }

    bot.action(confirmProposal.regex, async (ctx) => {
        const state = ctx.user.state
        if (!isNegotiationState(state)) {
            return
        }
        ctx.logEvent('quest: proposal', { questId: state.questId })
        const texts = i18n(ctx).questNegotiation
        if (!state.date) {
            return ctx.reply(
                texts.proposeDate(),
                ctx.getCalendar(onDateSet, ctx.from?.language_code)
            )
        }
        if (!state.place) {
            return ctx.editMessageText(
                texts.proposePlace(),
                Markup.inlineKeyboard([])
            )
        }
        await ctx.user.setState(null)
        await ctx.tribalizm.questNegotiation.proposeChange({
            place: state.place,
            time: ctx.user.toServerTime(state.date).getTime(),
            userId: ctx.user.userId,
            questId: state.questId,
        })
        await removeInlineKeyboard(ctx, `\n${texts.proposalDone()}`)
    })

    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        if (isNegotiationState(state)) {
            const texts = i18n(ctx).questNegotiation
            if (!state.date) {
                await ctx.reply(
                    texts.proposeDate(),
                    ctx.getCalendar(onDateSet, ctx.from?.language_code)
                )
                return
            }
            const place = ctx.message.text
            await ctx.user.setState({ ...state, place })

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.confirm(),
                    confirmProposal.serialize()
                ),
                Markup.button.callback(
                    texts.edit(),
                    negotiate.serialize({
                        questId: state.questId,
                    })
                ),
            ])

            const proposal = texts.proposal({ date: state.date, place })
            await ctx.reply(texts.proposalConfirmPrompt({ proposal }), kb)
        } else {
            return next()
        }
    })

    bot.action(agreeQuest.regex, async (ctx) => {
        const { memberId, questId } = agreeQuest.parse(ctx.match[0])
        ctx.logEvent('quest: agree', { questId })
        await ctx.tribalizm.questNegotiation.acceptQuest({
            userId: ctx.user.userId,
            questId,
        })
        const quest = await ctx.tribalizm.questNegotiation.questDetails({
            questId,
        })
        const texts = i18n(ctx).questNegotiation
        let text: string
        if (quest.participants.length > 2) {
            text = texts.proposalAgreed(quest.participants.length - 1)
        } else {
            const other = quest.participants.find((p) => p.id !== memberId)
            if (!other) {
                throw new Error('Cant agree on quest with no participants')
            }
            text = texts.proposalAgreedPersonal({ who: other.name })
        }
        removeInlineKeyboard(ctx)
        await ctx.reply(text)
    })

    // ========= Handle Notifications ============
    bus.subscribe<QuestChangeMessage>(
        'quest-change-proposed',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const qnTexts = i18n(user).questNegotiation

            const proposal = qnTexts.proposal({
                date: user.toUserTime(new Date(payload.time)),
                place: payload.place,
            })
            let text = ''
            if (payload.questType === QuestType.initiation) {
                const texts = i18n(user).initiation
                if (payload.elder) {
                    // X, shaman|chief of the tribe Y proposed to meet: ...
                    text = texts.questNotification({
                        name: payload.proposingMemberName,
                        tribe: payload.tribe,
                        proposal,
                    })
                } else {
                    text = texts.questNotificationForElder({
                        name: payload.proposingMemberName,
                        tribe: payload.tribe,
                        proposal,
                    })
                }
            } else if (payload.questType === QuestType.introduction) {
                const texts = i18n(user).introduction
                text = texts.questNotification({
                    name: payload.proposingMemberName,
                    tribe: payload.tribe,
                    proposal,
                })
            } else {
                // coordination quests
                const texts = i18n(user).coordination

                text = texts.questNotification({
                    name: payload.proposingMemberName,
                    tribe: payload.tribe,
                    // description is mandatory for coordination quests so..
                    description: payload.description || '??\\_(???)_/?? ',
                    proposal,
                })
            }

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    qnTexts.confirm(),
                    agreeQuest.serialize({
                        questId: payload.questId,
                        memberId: payload.targetMemberId,
                    })
                ),
                Markup.button.callback(
                    qnTexts.proposeOther(),
                    negotiate.serialize({
                        questId: payload.questId,
                    })
                ),
            ])

            await bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )

    bus.subscribe<QuestAcceptedMessage>(
        'quest-accepted',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const qnTexts = i18n(user).questNegotiation
            const proposal = qnTexts.proposal({
                date: user.toUserTime(new Date(payload.time)),
                place: payload.place,
            })
            let text: string
            if (payload.members.length > 2) {
                text = qnTexts.questAccepted({
                    // TODO add some default description? (this is kinda impossible case anyway)
                    description: payload.description || '',
                    proposal,
                })
            } else {
                const who = payload.members.find(
                    (m) => m.id !== payload.targetMemberId
                )
                if (!who)
                    throw new Error(
                        'Cannot agree on quest with no participants'
                    )
                text = qnTexts.questAcceptedPersonal({
                    proposal,
                    who: who.name,
                })
            }
            await bot.telegram.sendMessage(user.chatId, text)
        }
    )
}
