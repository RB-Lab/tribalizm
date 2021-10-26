import { ITribe, TribeType } from '../../../../use-cases/entities/tribe'
import { Markup, Telegraf } from 'telegraf'
import L from '../../i18n/i18n-node'
import { toLocale } from '../../i18n/to-locale'

const names = [
    ['id_1', 'любители котиков', "Мы восхищаемся котиками и всеми, что с ними связано"],
    ['id_2', 'Lex Fridman podcast descussion', 'Here we discuss Lex fridman podcast and related stuff'],
    ['id_3', 'Открытый космос СПБ', 'Группа поддержки открытого космоса в Санкт_Петербурге'],
    ['id_4', 'Энтузиасты электро транспорта', 'Мы боримся за внедрение электро транспорта в СПБ'],
    ['id_5', 'Less Wrong', 'Сообщество рационалистов'],
    ['id_6', 'Steam Punk', 'Настоящая паропанковская туса!'],
]

const tribes: ITribe[] = names.map(([id, name, description]) => 
    ({
        id,
        name,
        description,
        chiefId: '',
        logo: 'http://lorempixel.com/80/80/',
        cityId: '',
        shamanId: '',
        vocabulary: TribeType.tribe
    })
)

export function tribesListScreen(bot: Telegraf) {
    bot.action('list-tribes', (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].tribesList

        const keyboard = Markup.keyboard([
            Markup.button.locationRequest(texts.requestLocation()),
        ]).oneTime().resize()
        ctx.deleteMessage()
        ctx.reply(texts.requestLocationText(), keyboard).then((d) => {
            d.message_id
        })
    })

    bot.on('message', ctx => {
        if((ctx.message as any).location) {
            const l = toLocale(ctx.from?.language_code)
            const texts = L[l].tribesList
            // TODO save location to user's DB record, use it in getLocalTribes
            tribes.forEach((tribe) => {
                const keyboard = Markup.inlineKeyboard([
                    Markup.button.callback(texts.apply(),  `apply-tribe/${tribe.id}`)
                ])
                ctx.replyWithHTML(
                    `<b>${tribe.name}</b>
                    ${tribe.description}
                    `,
                    keyboard
                )
            })
        }
    })
    bot.action(/apply-tribe\/+/, (ctx) => {
        ctx.reply(`*Ololo!!!* ${ctx.message}`)
    })
}
