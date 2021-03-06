import { Markup } from 'telegraf'
import { Maybe, notEmpty } from '../../../../ts-utils'
import { IdeaIncarnationMessage } from '../../../../use-cases/incarnate-ideas'
import { CoordinationQuestAcceptedMessage } from '../../../../use-cases/negotiate-quest'
import { NewCoordinationQuestMessage } from '../../../../use-cases/spawn-quest'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext, TribeCtx } from '../tribe-ctx'
import { UserState } from '../users-adapter'
import { makeCallbackDataParser } from './callback-parser'
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
    parentQuestId: string
    description?: string
    date?: Date
    place?: string
    gatheringType: 'upvoters' | 'all'
}
function isGatherState(state: Maybe<UserState>): state is GatherState {
    return notEmpty(state) && state.type === 'gather-state'
}

const gatherConfirm = makeCallbackDataParser('gather-confirm', [])

const spawn = makeCallbackDataParser('spawn-quest', ['questId', 'memberId'])
const gathering = makeCallbackDataParser('declare-gathering', [
    'questId',
    'type',
])
const reQuest = makeCallbackDataParser('re-quest', ['questId', 'memberId'])

export function coordinationScreen({ bot, bus, tgUsers }: TgContext) {
    bot.action(spawn.regex, async (ctx) => {
        const { questId, memberId } = spawn.parse(ctx.match[0])
        await ctx.user.setState<SpawnState>({
            type: 'spawn-quest-state',
            memberId,
            parentQuestId: questId,
        })

        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).coordination.spawnDescribe())
    })
    bot.action(gathering.regex, async (ctx) => {
        const { questId, type } = gathering.parse(ctx.match[0])
        await ctx.user.setState<GatherState>({
            type: 'gather-state',
            gatheringType: type,
            parentQuestId: questId,
        })

        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).coordination.gatheringDescribe())
    })
    async function onDateSet(date: Date, ctx: TribeCtx) {
        const texts = i18n(ctx).coordination
        const state = ctx.user.state
        if (isGatherState(state)) {
            state.date = date
            await ctx.user.setState(state)

            if (state.description && state.place) {
                showConfirm(ctx)
            } else {
                const text = state.description
                    ? texts.gatheringSetPlace()
                    : texts.gatheringDescribe()
                await ctx.reply(text)
            }
        }
    }

    async function showConfirm(ctx: TribeCtx) {
        const texts = i18n(ctx).coordination
        const state = ctx.user.state
        if (!isGatherState(state)) return
        if (!state.description || !state.place || !state.date) {
            const text = Object.entries(state)
                .map((e) => e.join(': '))
                .join(',')
            throw new Error(`Cannot confirm incomplete gathering: {${text}}`)
        }

        const what =
            state.gatheringType == 'all'
                ? texts.what.all()
                : texts.what.upvoters()
        const proposal = texts.proposal({
            date: state.date,
            place: state.place,
        })
        await ctx.reply(
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
                        type: state.gatheringType,
                        questId: state.parentQuestId,
                    })
                ),
            ])
        )
    }
    bot.action(gatherConfirm.regex, async (ctx) => {
        const state = ctx.user.state
        if (!isGatherState(state)) return
        if (!state.description || !state.place || !state.date) {
            const text = Object.entries(state)
                .map((e) => e.join(': '))
                .join(',')
            throw new Error(`Cannot confirm incomplete gathering: {${text}}`)
        }
        await ctx.user.setState(null)
        removeInlineKeyboard(ctx)
        await ctx.reply(i18n(ctx).coordination.gatheringDone())
        ctx.logEvent('gathering: propose', {
            parentQuestId: state.parentQuestId,
        })
        await ctx.tribalizm.gatheringDeclare.declare({
            description: state.description,
            userId: ctx.user.userId,
            parentQuestId: state.parentQuestId,
            place: state.place,
            time: ctx.user.toServerTime(state.date).getTime(),
            type: state.gatheringType,
        })
    })
    bot.on('text', async (ctx, next) => {
        const state = ctx.user.state
        const texts = i18n(ctx).coordination
        if (isSpawnState(state)) {
            await ctx.user.setState(null)
            ctx.logEvent('quest: spawn', { parentQuestId: state.parentQuestId })

            await ctx.tribalizm.spawnQuest.spawnQuest({
                description: ctx.message.text,
                memberId: state.memberId,
                parentQuestId: state.parentQuestId,
            })
            await ctx.reply(texts.questAssigned())
        } else if (isGatherState(state)) {
            if (!state.description) {
                state.description = ctx.message.text
                await ctx.user.setState(state)
            } else {
                state.place = ctx.message.text
                await ctx.user.setState(state)
            }
            if (!state.date) {
                await ctx.reply(
                    texts.gatheringWhen(),
                    ctx.getCalendar(onDateSet, ctx.from?.language_code)
                )
            } else {
                await showConfirm(ctx)
            }
        } else {
            return next()
        }
    })

    // ===================== Handle Notifications ===================

    bus.subscribe<IdeaIncarnationMessage>(
        'idea-incarnation',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).coordination

            await bot.telegram.sendMessage(
                user.chatId,
                texts.coordinateOwnIdea({
                    name: payload.partner,
                    description: payload.description,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.okay(),
                        negotiate.serialize({
                            questId: payload.questId,
                        })
                    ),
                ])
            )
        }
    )
    bus.subscribe<CoordinationQuestAcceptedMessage>(
        'coordination-quest-accepted',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
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
            await bot.telegram.sendMessage(
                user.chatId,
                questManage({ name: partner.name }),
                kb
            )
        }
    )
    bus.subscribe<NewCoordinationQuestMessage>(
        'new-coordination-quest-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const partner = payload.members.filter(
                (m) => m.id !== payload.targetMemberId
            )[0]

            const texts = i18n(user).coordination

            await bot.telegram.sendMessage(
                user.chatId,
                texts.coordinateSpawned({
                    name: partner.name,
                    description: payload.description,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.okay(),
                        negotiate.serialize({
                            questId: payload.questId,
                        })
                    ),
                ])
            )
        }
    )
}
