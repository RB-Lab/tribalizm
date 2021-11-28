import { Markup, Telegraf } from 'telegraf'
import Calendar from 'telegraf-calendar-telegram'
import { i18n } from '../i18n/i18n-ctx'
import { TribeCtx } from './tribe-ctx'
import { makeCalbackDataParser } from './screens/calback-parser'

const calendarHours = makeCalbackDataParser('date-time-picker-hours', [
    'date',
    'hours',
])
const calendarMinutes = makeCalbackDataParser('date-time-picker-minutes', [
    'dateString',
    'minutes',
])
const hours = '08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23'.split(',')

type SetDateHandler = (date: Date, ctx: TribeCtx) => void

export class DateTimePicker {
    private locale?: string
    private calendar: Calendar<TribeCtx>
    private handler?: SetDateHandler

    constructor(bot: Telegraf<TribeCtx>) {
        // TODO this calendar fucks up on October 2021 (probably because of one day in last row)
        this.calendar = new Calendar(bot, {
            minDate: new Date(),
            maxDate: new Date(9635660707441),
        })
        this.calendar.setDateListener((ctx, date) => {
            const texts = i18n(ctx).calendar
            const kb = Markup.inlineKeyboard(
                hours.map((hours) =>
                    Markup.button.callback(
                        hours,
                        calendarHours.serialize({ date, hours })
                    )
                ),
                { columns: 4 }
            )
            ctx.editMessageText(texts.proposeTimeHours(), kb)
        })

        bot.action(calendarHours.regex, async (ctx) => {
            const texts = i18n({ locale: this.locale }).calendar
            const { hours, date } = calendarHours.parse(ctx.match[0])
            const keys = ['00', '15', '30', '45'].map((minutes) =>
                Markup.button.callback(
                    minutes,
                    calendarMinutes.serialize({
                        dateString: `${date} ${hours}`,
                        minutes,
                    })
                )
            )
            await ctx.answerCbQuery()
            ctx.editMessageText(
                texts.proposeTimeMinutes(),
                Markup.inlineKeyboard(keys)
            )
        })
        bot.action(calendarMinutes.regex, async (ctx) => {
            const { minutes, dateString } = calendarMinutes.parse(ctx.match[0])

            const date = new Date(`${dateString}:${minutes}`)
            await ctx.answerCbQuery()
            if (this.handler) {
                this.handler(date, ctx)
            }
        })
    }
    getCalerndar = (handler: SetDateHandler, locale = 'en') => {
        this.locale = locale
        const texts = i18n({ locale }).calendar

        this.calendar.setMonthNames(texts.months().split(','))
        this.calendar.setWeekDayNames(texts.weekdays().split(','))
        this.calendar.setStartWeekDay(Number(texts.startWeekDay()))
        this.handler = handler

        return this.calendar.getCalendar(new Date())
    }
}
