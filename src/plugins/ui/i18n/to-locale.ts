import L from './i18n-node'

export const toLocale = (code?: string): keyof typeof L => code === 'ru' ? 'ru' : 'en'
