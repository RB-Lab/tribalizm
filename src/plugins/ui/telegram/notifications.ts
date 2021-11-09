import { Markup, Scenes, Telegraf } from 'telegraf'
import { ApplicationMessage } from '../../../use-cases/apply-tribe'
import { ApplicationDeclined } from '../../../use-cases/initiation'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { QuestMessage } from '../../../use-cases/utils/quest-message'
import { L } from '../i18n/i18n-node'
import { toLocale } from '../i18n/to-locale'
import { TelegramUsersAdapter } from './users-adapter'

export function attachNotifications(
    bot: Telegraf<Scenes.SceneContext>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await telegramUsers.getUserById(payload.elderUserId)
            const l = toLocale(elder.provider.telegram.locale)
            const texts = L[l].notifications.tribeAppliaction

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    `propose-initiation:${payload.applicationId}`
                ),
                Markup.button.callback(
                    texts.decline(),
                    `decline-application:${payload.applicationId}`
                ),
            ])

            bot.telegram.sendMessage(
                elder.provider.telegram.chatId,
                `<b>${texts.title({
                    tribe: payload.tribeName,
                })}</b>\n\n${texts.applicant({
                    username: `<i>${payload.userName}</i>`,
                })}\n${texts.coverLetter()}\n${payload.coverLetter}`,
                { parse_mode: 'HTML', reply_markup: keyboard.reply_markup }
            )
        }
    )
    bus.subscribe<ApplicationDeclined>(
        'application-declined',
        async ({ payload }) => {
            const user = await telegramUsers.getUserById(payload.targetUserId)
            const l = toLocale(user.provider.telegram.locale)
            const texts = L[l].notifications.tribeAppliaction

            bot.telegram.sendMessage(
                user.provider.telegram.chatId,
                texts.declinedForApplicant({ tribe: payload.tribeName })
            )
        }
    )
    // FIXME for quests other than initiation targetUserId is still member.id
    bus.subscribe<QuestMessage>('new-quest-message', async ({ payload }) => {
        const user = await telegramUsers.getUserById(payload.targetUserId)
        const l = toLocale(user.provider.telegram.locale)
        // TODO generalize quest negotiation
        const texts = L[l].initiation

        const kb = Markup.inlineKeyboard([
            Markup.button.callback(texts.confirm(), 'confirm-quest'),
            Markup.button.callback(
                texts.proposeOther(),
                'propose-quest-change'
            ),
        ])
        const date = new Date(payload.time)
        const place = payload.place

        bot.telegram.sendMessage(
            user.provider.telegram.chatId,

            texts.proposal({ date, place }),
            kb
        )
    })
}
