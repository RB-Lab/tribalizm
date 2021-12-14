import { Markup, Telegraf } from 'telegraf'
import Calendar from 'telegraf-calendar-telegram'
import { i18n } from '../i18n/i18n-ctx'
import { TribeCtx } from './tribe-ctx'
import { makeCallbackDataParser } from './screens/callback-parser'
import { ILogger } from '../../../use-cases/utils/logger'

const calendarHours = makeCallbackDataParser('date-time-picker-hours', [
    'date',
    'hour',
])
const calendarMinutes = makeCallbackDataParser('date-time-picker-minutes', [
    'dateString',
    'minutes',
])
const hours = '08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23'.split(',')

type SetDateHandler = (date: Date, ctx: TribeCtx) => void

export class DateTimePicker {
    private locale?: string
    private calendar: Calendar<TribeCtx>
    private handler?: SetDateHandler
    private logger: ILogger

    constructor(bot: Telegraf<TribeCtx>, logger: ILogger) {
        this.logger = logger
        // TODO this calendar fucks up on October 2021 (probably because of one day in last row)
        this.calendar = new Calendar(bot, {
            minDate: new Date(),
            maxDate: new Date(9635660707441),
        })
        this.calendar.setDateListener((ctx, date) => {
            logger.trace('calendar: date set', { date })
            const texts = i18n(ctx).calendar
            const kb = Markup.inlineKeyboard(
                hours.map((hour) =>
                    Markup.button.callback(
                        hour,
                        calendarHours.serialize({ date, hour })
                    )
                ),
                { columns: 4 }
            )
            ctx.editMessageText(texts.proposeTimeHours(), kb)
        })

        bot.action(calendarHours.regex, async (ctx) => {
            const texts = i18n({ locale: this.locale }).calendar
            const { hour, date } = calendarHours.parse(ctx.match[0])
            logger.trace('calendar: hour set', { date: `${date} ${hour}` })
            const keys = ['00', '15', '30', '45'].map((minutes) =>
                Markup.button.callback(
                    minutes,
                    calendarMinutes.serialize({
                        dateString: `${date} ${hour}`,
                        minutes,
                    })
                )
            )
            await ctx.answerCbQuery()
            await ctx.editMessageText(
                texts.proposeTimeMinutes(),
                Markup.inlineKeyboard(keys)
            )
        })
        bot.action(calendarMinutes.regex, async (ctx) => {
            const { minutes, dateString } = calendarMinutes.parse(ctx.match[0])

            const date = new Date(`${dateString}:${minutes}`)
            logger.trace('calendar: minutes set', { date })
            await ctx.answerCbQuery()
            if (this.handler) {
                this.handler(date, ctx)
            }
        })
    }
    getCalendar = (handler: SetDateHandler, locale = 'en') => {
        this.logger.trace('calendar: requested')
        this.locale = locale
        const texts = i18n({ locale }).calendar

        this.calendar.setMonthNames(texts.months().split(','))
        this.calendar.setWeekDayNames(texts.weekdays().split(','))
        this.calendar.setStartWeekDay(Number(texts.startWeekDay()))
        this.handler = handler

        return this.calendar.getCalendar(new Date())
    }
}
