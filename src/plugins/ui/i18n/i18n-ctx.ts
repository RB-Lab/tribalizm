import L from './i18n-node'

export const toLocale = (code?: string): keyof typeof L =>
    code === 'ru' ? 'ru' : 'en'

export const i18n = (ctx: { from?: { language_code?: string } }) =>
    L[toLocale(ctx.from?.language_code)]
