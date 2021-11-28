import { Markup, Telegraf } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { IdeaIncarnationMessage } from '../../../../use-cases/incarnate-ideas'
import { CoordinationQuestAcceptedMessage } from '../../../../use-cases/negotiate-quest'
import { NewCoordinationQuestMessage } from '../../../../use-cases/spawn-quest'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter, UserState } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'
import { negotiate } from './quest-negotiation'

interface SpawnState extends UserState {
    type: 'spawn-quest-state'
    memberId: string
    parentQuestId: string
}
function isSpawnState(state: Maybe<UserState>): state is SpawnState {
    return notEmpty(state) && state.type === 'spawn-quest-state'
}
interface GatherState extends UserState {
    type: 'gather-state'
    memberId: string
    parentQuestId: string
    description?: string
    date?: Date
    place?: string
    gatheringType: 'upvoters' | 'all'
}
function isGatherState(state: Maybe<UserState>): state is GatherState {
    return notEmpty(state) && state.type === 'gather-state'
}

function actions(bot: Telegraf<TribeCtx>) {
    bot.action(spawn.regex, async (ctx) => {
        const { questId, memberId } = spawn.parse(ctx.match[0])
        ctx.user.setState<SpawnState>({
            type: 'spawn-quest-state',
            memberId,
            parentQuestId: questId,
        })
        ctx.reply(i18n(ctx).coordination.spawnDescribe())
    })
    bot.action(gathering.regex, async (ctx) => {
        const { questId, memberId, type } = gathering.parse(ctx.match[0])
        ctx.user.setState<GatherState>({
            type: 'gather-state',
            gatheringType: type,
            memberId,
            parentQuestId: questId,
        })
        ctx.reply(i18n(ctx).coordination.gatheringDescribe())
    })
    async function onDateSet(date: Date, ctx: TribeCtx) {
        const texts = i18n(ctx).coordination
        const state = ctx.user.state
        if (isGatherState(state)) {
            state.date = date
            ctx.user.setState(state)

            if (state.description && state.place) {
                showConfirm(ctx)
            } else {
                const text = state.description
                    ? texts.gatheringSetPlace()
                    : texts.gatheringDescribe()
                ctx.reply(text)
            }
        }
    }

    async function showConfirm(ctx: TribeCtx) {
        const texts = i18n(ctx).coordination
        const state = ctx.user.state
        if (!isGatherState(state)) return

        if (state.description && state.place && state.date) {
            const what =
                state.gatheringType == 'all'
                    ? texts.what.all()
                    : texts.what.upvoters()
            const proposal = texts.proposal({
                date: state.date,
                place: state.place,
            })
            ctx.reply(
                texts.confirmPrompt({
                    description: state.description,
                    what,
                    proposal,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.confirm(),
                        gatherConfirm.serialize({})
                    ),
                    Markup.button.callback(
                        texts.edit(),
                        gathering.serialize({
                            memberId: state.memberId,
                            type: state.gatheringType,
                            questId: state.parentQuestId,
                        })
                    ),
                ])
            )
        } else {
            ctx.reportError(reportStateError(state))
        }
    }
    function reportStateError(state: object) {
        let text = 'null'
        if (state) {
            text = Object.entries(state)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')
        }
        return new Error(`Cannot confirm incomplete gathering: {${text}}`)
    }
    bot.action(gatherConfirm.regex, async (ctx) => {
        const state = ctx.user.state
        if (!isGatherState(state)) return
        if (!state.description || !state.place || !state.date) {
            ctx.reportError(reportStateError(state))
            return
        }
        await ctx.user.setState(null)
        removeInlineKeyboard(ctx)
        ctx.reply(i18n(ctx).coordination.gatheringDone())
        await ctx.tribalizm.gatheringDeclare.declare({
            description: state.description,
            memberId: state.memberId,
            parentQuestId: state.parentQuestId,
            place: state.place,
            time: state.date.getTime(),
            type: state.gatheringType,
        })
    })
    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        const texts = i18n(ctx).coordination
        if (isSpawnState(state)) {
            await ctx.tribalizm.spawnQuest.spawnQuest({
                description: ctx.message.text,
                memberId: state.memberId,
                parentQuestId: state.parentQuestId,
            })
            await ctx.reply(texts.questAssigned())
            ctx.user.setState(null)
        } else if (isGatherState(state)) {
            if (!state.description) {
                state.description = ctx.message.text
                await ctx.user.setState(state)
            } else {
                state.place = ctx.message.text
                ctx.user.setState(state)
            }
            if (!state.date) {
                ctx.reply(
                    texts.gatheringWhen(),
                    ctx.getCalenar(onDateSet, ctx.from?.language_code)
                )
            } else {
                await showConfirm(ctx)
            }
        } else {
            next()
        }
    })
}

const gatherConfirm = makeCalbackDataParser('gather-confrim', [])

const spawn = makeCalbackDataParser('spawn-quest', ['questId', 'memberId'])
const gathering = makeCalbackDataParser('declare-gathering', [
    'questId',
    'memberId',
    'type',
])
const reQuest = makeCalbackDataParser('re-quest', ['questId', 'memberId'])

function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<IdeaIncarnationMessage>(
        'idea-incarnation',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).coordination

            bot.telegram.sendMessage(
                user.chatId,
                texts.coordinateOwnIdea({
                    name: payload.partner,
                    description: payload.description,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.okay(),
                        negotiate.serialize({
                            memberId: payload.targetMemberId,
                            questId: payload.questId,
                            elder: null,
                        })
                    ),
                ])
            )
        }
    )
    bus.subscribe<CoordinationQuestAcceptedMessage>(
        'coordination-quest-accepted',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const { buttons, questManage } = i18n(user).coordination
            const partner = payload.members.filter(
                (m) => m.id !== payload.targetMemberId
            )[0]

            const params = {
                memberId: payload.targetMemberId,
                questId: payload.questId,
            }
            // TODO Remove buttons, when show "how was it"
            const kb = Markup.inlineKeyboard(
                [
                    Markup.button.callback(
                        buttons.spawn(),
                        spawn.serialize(params)
                    ),
                    Markup.button.callback(
                        buttons.reQuest(),
                        reQuest.serialize(params)
                    ),
                    Markup.button.callback(
                        buttons.gatherUpwoters(),
                        gathering.serialize({
                            ...params,
                            type: 'upvoters',
                        })
                    ),
                    Markup.button.callback(
                        buttons.gatherTribe(),
                        gathering.serialize({
                            ...params,
                            type: 'all',
                        })
                    ),
                ],
                { columns: 2 }
            )
            bot.telegram.sendMessage(
                user.chatId,
                questManage({ name: partner.name }),
                kb
            )
        }
    )
    bus.subscribe<NewCoordinationQuestMessage>(
        'new-coordination-quest-message',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const partner = payload.members.filter(
                (m) => m.id !== payload.targetMemberId
            )[0]

            const texts = i18n(user).coordination

            bot.telegram.sendMessage(
                user.chatId,
                texts.coordinateSpawned({
                    name: partner.name,
                    description: payload.description,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.okay(),
                        negotiate.serialize({
                            elder: null,
                            memberId: payload.targetMemberId,
                            questId: payload.questId,
                        })
                    ),
                ])
            )
        }
    )
}

export const coordinationScreen = { attachNotifications, actions }
