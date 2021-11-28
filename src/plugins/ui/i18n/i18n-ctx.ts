import L from './i18n-node'

export const toLocale = (code?: string): keyof typeof L =>
    code === 'ru' ? 'ru' : 'en'

export type Ctx =
    | {
          from?: {
              language_code?: string
          }
      }
    | { locale?: string }

export const i18n = (ctx: Ctx) => {
    if ('from' in ctx) {
        return L[toLocale(ctx.from?.language_code)]
    } else if ('locale' in ctx) {
        return L[toLocale(ctx.locale)]
    }
    return L.en
}
