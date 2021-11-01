import type { FormattersInitializer } from 'typesafe-i18n'
import type { Locales, Formatters } from './i18n-types'
import { date } from 'typesafe-i18n/formatters'

export const initFormatters: FormattersInitializer<Locales, Formatters> = (
    locale: Locales
) => {
    const formatters: Formatters = {
        // add your formatter functions here
        date: date(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }),
    }

    return formatters
}
