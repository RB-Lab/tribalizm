import { Markup, Scenes, Telegraf } from 'telegraf'
import L from '../../i18n/i18n-node'
import { toLocale } from '../../i18n/to-locale'
import { TelegramUsers } from '../mocks'
import { Tribalizm } from '../tribalism'
import Calendar from 'telegraf-calendar-telegram'

export function initiationScreen(
    bot: Telegraf<Scenes.SceneContext>,
    tribalizm: Tribalizm,
    telegramUsers: TelegramUsers
) {
    const proposeInitiation = new Scenes.BaseScene<Scenes.SceneContext>(
        'propose-initiation'
    )

    proposeInitiation.enter((ctx) => {
        // TODO this calendar fucks up on October 2021 (probably because of one day in last row)
        const calendar = new Calendar(proposeInitiation, {
            minDate: new Date(),
            maxDate: new Date(9635660707441),
            monthNames: i18n(ctx).months().split(','),
            weekDayNames: i18n(ctx).weekdays().split(','),
            startWeekDay: parseInt(i18n(ctx).startWeekDay()),
        })

        calendar.setDateListener((ctx, date) => {
            const hours =
                '08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23'.split(',')
            const kb = Markup.inlineKeyboard(
                hours.map((h) => Markup.button.callback(h, `set-hours:${h}`)),
                { columns: 4 }
            )
            ctx.editMessageText(i18n(ctx).proposeTimeHours(), kb)
            ;((ctx as any).scene.state as any).date = date
        })
        ctx.reply(i18n(ctx).proposeDate(), calendar.getCalendar(new Date()))
    })

    proposeInitiation.action(/set-hours:(\d{2,2})/, (ctx) => {
        const minutes = '00,15,30,45'.split(',')
        const kb = Markup.inlineKeyboard(
            minutes.map((m) => Markup.button.callback(m, `set-minutes:${m}`))
        )

        ;(ctx.scene.state as any).date = `${(ctx.scene.state as any).date} ${
            ctx.match[1]
        }`
        ctx.editMessageText(i18n(ctx).proposeTimeMinutes(), kb)
    })

    proposeInitiation.action(/set-minutes:(\d{2,2})/, (ctx) => {
        ;(ctx.scene.state as any).date = new Date(
            `${(ctx.scene.state as any).date}:${ctx.match[1]}`
        )
        ctx.editMessageText(i18n(ctx).proposePlace(), Markup.inlineKeyboard([]))
    })

    proposeInitiation.on('text', (ctx) => {
        const kb = Markup.inlineKeyboard([
            Markup.button.callback(i18n(ctx).confirm(), 'confirm-proposal'),
            Markup.button.callback(i18n(ctx).edit(), 'redo-proposal'),
        ])
        const place = ctx.message.text
        const date = (ctx.scene.state as any).date
        ;(ctx.scene.state as any).place = place
        ctx.reply(i18n(ctx).proposal({ date, place }), kb)
    })

    proposeInitiation.action('confirm-proposal', async (ctx) => {
        const user = await telegramUsers.getUserByChatId(ctx.chat?.id)
        if (!user) {
            // 🤔 Or just create this user here???
            throw new Error(`Cannot find user for chat ${ctx.chat?.id}`)
        }
        const date = (ctx.scene.state as any).date
        const place = (ctx.scene.state as any).place
        await tribalizm.initiation.startInitiation({
            applicationId: (ctx.scene.state as any).appId,
            elderUserId: user.id,
            place: place,
            // TODO here don't forget to offset user's time zone!
            time: date.getTime(),
        })
        ctx.editMessageText(
            `${i18n(ctx).proposal({ date, place })}\n\n${i18n(
                ctx
            ).proposalDone()}`,
            Markup.inlineKeyboard([])
        )
    })

    proposeInitiation.action('redo-proposal', (ctx) => {
        // Remove keyboard
        ctx.editMessageText(
            (ctx.update.callback_query.message as any).text,
            Markup.inlineKeyboard([])
        )
        ctx.scene.leave()
        ctx.scene.enter('propose-initiation', {
            appId: (ctx.scene.state as any).appId,
        })
    })

    const declineInitiaton = new Scenes.BaseScene<Scenes.SceneContext>(
        'declline-application'
    )
    declineInitiaton.enter((ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].initiation

        ctx.reply(texts.declineText())
    })
    declineInitiaton.on('text', async (ctx) => {
        const l = toLocale(ctx.from?.language_code)
        const texts = L[l].initiation
        ctx.reply(texts.declinedForElder())
        const user = await telegramUsers.getUserByChatId(ctx.chat.id)
        if (!user) {
            // 🤔 Or just create this user here???
            throw new Error(`Cannot find user for chat ${ctx.chat.id}`)
        }
        // TODO should use the text maybe?
        tribalizm.initiation.decline({
            applicationId: (ctx.scene.state as any).appId,
            elderUserId: user.id,
        })
        ctx.scene.leave()
    })

    const stage = new Scenes.Stage<Scenes.SceneContext>([
        proposeInitiation,
        declineInitiaton,
    ])

    bot.use(stage.middleware())

    bot.action(/propose-initiation:(.+)/, (ctx) => {
        ctx.scene.enter('propose-initiation', { appId: ctx.match[1] })
    })

    bot.action(/declline-application:(.+)/, (ctx) => {
        ctx.scene.enter('declline-application', { appId: ctx.match[1] })
    })
}

function i18n(ctx: { from?: { language_code?: string } }) {
    const l = toLocale(ctx.from?.language_code)
    return L[l].initiation
}
