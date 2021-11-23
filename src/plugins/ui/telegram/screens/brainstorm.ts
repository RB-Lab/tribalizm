import { Markup, Telegraf } from 'telegraf'
import Calendar from 'telegraf-calendar-telegram'
import { NewIdeaMessage } from '../../../../use-cases/add-idea'
import { TimeToStormMessage } from '../../../../use-cases/admin'
import {
    BrainstormDeclarationMessage,
    BrainstormNoticeMessage,
    BrainstormStartedMessage,
} from '../../../../use-cases/brainstorm-lifecycle'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter, UserState } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

const hours = '08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23'.split(',')

const startBrst = makeCalbackDataParser('storm-start', ['memberId'])

interface BrainstormState extends UserState {
    type: 'brainstorm'
    memberId: string
    brainstormId: string
}
function isBarinstormState(
    state: undefined | { type: string }
): state is BrainstormState {
    return state !== undefined && state.type === 'brainstorm'
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
    })
}

const calendarHours = makeCalbackDataParser('storm-calendar-hours', [
    'memberId',
    'date',
    'hours',
])
const calendarMinutes = makeCalbackDataParser('storm-calendar-minutes', [
    'memberId',
    'dateString',
    'minutes',
])
const stormConfirm = makeCalbackDataParser('storm-confirm', [
    'memberId',
    'time',
])
function actions(bot: Telegraf<TribeCtx>) {
    bot.action(startBrst.regex, async (ctx) => {
        const calendarTexts = i18n(ctx).calendar
        const bstrTexts = i18n(ctx).brainstorm
        const { memberId } = startBrst.parse(ctx.match[0])

        const calendar = new Calendar(bot, {
            minDate: new Date(),
            maxDate: new Date(9635660707441),
            monthNames: calendarTexts.months().split(','),
            weekDayNames: calendarTexts.weekdays().split(','),
            startWeekDay: parseInt(calendarTexts.startWeekDay()),
        })

        calendar.setDateListener((ctx, date) => {
            const kb = Markup.inlineKeyboard(
                hours.map((hours) =>
                    Markup.button.callback(
                        hours,
                        calendarHours.serialize({ memberId, date, hours })
                    )
                ),
                { columns: 4 }
            )
            ctx.editMessageText(bstrTexts.proposeTimeHours(), kb)
        })
        ctx.reply(bstrTexts.proposeDate(), calendar.getCalendar(new Date()))
    })
    bot.action(calendarHours.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { hours, date, memberId } = calendarHours.parse(ctx.match[0])
        const keys = ['00', '15', '30', '45'].map((minutes) =>
            Markup.button.callback(
                minutes,
                calendarMinutes.serialize({
                    memberId,
                    dateString: `${date} ${hours}`,
                    minutes,
                })
            )
        )
        ctx.editMessageText(
            texts.proposeTimeMinutes(),
            Markup.inlineKeyboard(keys)
        )
    })
    bot.action(calendarMinutes.regex, async (ctx) => {
        const texts = i18n(ctx).brainstorm
        const { minutes, dateString, memberId } = calendarMinutes.parse(
            ctx.match[0]
        )
        const date = new Date(`${dateString}:${minutes}`)
        ctx.editMessageText(
            texts.confirmPrompt({ date }),
            Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.confirm(),
                    stormConfirm.serialize({ memberId, time: date.getTime() })
                ),
                Markup.button.callback(
                    texts.edit(),
                    startBrst.serialize({ memberId })
                ),
            ])
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
                meberId: state.memberId,
                description: ctx.message.text,
            })
        } else {
            next()
        }
    })
}

export const brainstormScreen = { actions, attachNotifications }
