import { Context } from 'telegraf'
import { ExtraReplyMessage } from 'telegraf/src/telegram-types'

declare module 'telegraf-calendar-telegram' {
    interface Options {
        startWeekDay?: number
        weekDayNames?: string[]
        monthNames?: string[]
        minDate?: Date | null
        maxDate?: Date | null
    }
    class Calendar<T extends Context> {
        constructor(bot: Telegraf, options?: Options)
        getCalendar(date?: Date): ExtraReplyMessage
        setDateListener(
            onDateSelected: (context: T, date: string) => void
        ): void
        setMinDate(date: Date): Calendar<T>
        setMaxDate(date: Date): Calendar<T>
        setWeekDayNames(names: string[]): Calendar<T>
        setMonthNames(names: string[]): Calendar<T>
        setStartWeekDay(startDay: number): Calendar<T>
    }

    export default Calendar
}
