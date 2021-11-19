import { Markup, Scenes, Telegraf } from 'telegraf'
import Calendar from 'telegraf-calendar-telegram'
import { QuestType } from '../../../../use-cases/entities/quest'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { i18n } from '../../i18n/i18n-ctx'
import { SceneState } from '../scene-state'

function scenes(tribalizm: Tribalizm) {
    const questNegotiation = new Scenes.BaseScene<Scenes.SceneContext>(
        'quest-negotiation'
    )

    const hours = '08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23'.split(',')

    const sceneState = new SceneState<{
        date: Date
        dateString: string
        questId: string
        place: string
        memberId: string
        chiefInitiation?: true
        shamanInitiation?: true
    }>()
    questNegotiation.enter((ctx) => {
        const calendarTexts = i18n(ctx).calendar
        const texts = i18n(ctx).questNegotiation
        // TODO this calendar fucks up on October 2021 (probably because of one day in last row)
        const calendar = new Calendar(questNegotiation, {
            minDate: new Date(),
            maxDate: new Date(9635660707441),
            monthNames: calendarTexts.months().split(','),
            weekDayNames: calendarTexts.weekdays().split(','),
            startWeekDay: parseInt(calendarTexts.startWeekDay()),
        })

        calendar.setDateListener((ctx, date) => {
            const kb = Markup.inlineKeyboard(
                hours.map((h) => Markup.button.callback(h, `set-hours:${h}`)),
                { columns: 4 }
            )
            ctx.editMessageText(texts.proposeTimeHours(), kb)
            sceneState.set(ctx as any, 'dateString', date)
        })
        ctx.reply(texts.proposeDate(), calendar.getCalendar(new Date()))
    })

    questNegotiation.action(/set-hours:(\d{2,2})/, (ctx) => {
        const texts = i18n(ctx).questNegotiation
        const minutes = '00,15,30,45'.split(',')
        const kb = Markup.inlineKeyboard(
            minutes.map((m) => Markup.button.callback(m, `set-minutes:${m}`))
        )

        const date = sceneState.get(ctx, 'dateString')
        sceneState.set(ctx, 'dateString', `${date} ${ctx.match[1]}`)
        ctx.editMessageText(texts.proposeTimeMinutes(), kb)
    })

    questNegotiation.action(/set-minutes:(\d{2,2})/, (ctx) => {
        const texts = i18n(ctx).questNegotiation

        const date = `${sceneState.get(ctx, 'dateString')}:${ctx.match[1]}`
        sceneState.set(ctx, 'dateString', date)
        sceneState.set(ctx, 'date', new Date(date))
        ctx.editMessageText(texts.proposePlace(), Markup.inlineKeyboard([]))
    })

    questNegotiation.on('text', (ctx) => {
        const texts = i18n(ctx).questNegotiation
        const kb = Markup.inlineKeyboard([
            Markup.button.callback(texts.confirm(), 'confirm-proposal'),
            Markup.button.callback(texts.edit(), 'redo-proposal'),
        ])
        const place = ctx.message.text
        const date = sceneState.get(ctx, 'date')
        sceneState.set(ctx, 'place', place)
        const proposal = texts.proposal({ date, place })
        ctx.reply(texts.proposalConfirmPrompt({ proposal }), kb)
    })

    questNegotiation.action('confirm-proposal', async (ctx) => {
        const texts = i18n(ctx).questNegotiation
        const date = sceneState.get(ctx, 'date')
        const place = sceneState.get(ctx, 'place')
        if (sceneState.get(ctx, 'chiefInitiation')) {
            await tribalizm.initiation.startInitiation({
                questId: sceneState.get(ctx, 'questId'),
                elderUserId: ctx.state.userId,
            })
        }
        if (sceneState.get(ctx, 'shamanInitiation')) {
            await tribalizm.initiation.startShamanInitiation({
                questId: sceneState.get(ctx, 'questId'),
                elderUserId: ctx.state.userId,
            })
        }
        await tribalizm.questNegotiation.proposeChange({
            place: place,
            // TODO here don't forget to offset user's time zone!
            //      use "tz-db", timezone name is in cities database
            time: date.getTime(),
            memberId: sceneState.get(ctx, 'memberId'),
            questId: sceneState.get(ctx, 'questId'),
        })
        const proposal = texts.proposal({ date, place })
        const oldText = texts.proposalConfirmPrompt({ proposal })
        ctx.editMessageText(
            `${oldText}\n\n${texts.proposalDone()}`,
            Markup.inlineKeyboard([])
        )
    })

    questNegotiation.action('redo-proposal', async (ctx) => {
        // Remove keyboard
        await ctx.editMessageText(
            (ctx.update.callback_query.message as any).text,
            Markup.inlineKeyboard([])
        )
        await ctx.scene.leave()
        await ctx.scene.enter('quest-negotiation', {
            questId: sceneState.get(ctx, 'questId'),
        })
    })

    return [questNegotiation]
}
function actions(bot: Telegraf<Scenes.SceneContext>) {
    bot.action(/change-quest:(.+)/, (ctx) => {
        const [memberId, questId] = ctx.match[1].split(':')
        ctx.scene.enter('quest-negotiation', {
            questId,
            memberId,
        })
    })
}

export const questNegotiationScreen = { actions, scenes }
