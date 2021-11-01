import { Markup, Scenes, Telegraf } from 'telegraf'
import { ApplicationMessage } from '../../../use-cases/apply-tribe'
import { ApplicationDeclined } from '../../../use-cases/initiation'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import { L } from '../i18n/i18n-node'
import { toLocale } from '../i18n/to-locale'
import { TelegramUsers } from './mocks'

export function attachNotifications(
    bot: Telegraf<Scenes.SceneContext>,
    bus: NotificationBus,
    telegramUsers: TelegramUsers
) {
    bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await telegramUsers.getUserById(payload.elderUserId)
            if (!elder?.provider.telegram) {
                throw new Error(
                    `User ${payload.elderUserId} does not use telegram`
                )
            }
            const l = toLocale(elder.provider.telegram.locale)
            const texts = L[l].notifications.tribeAppliaction

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    `propose-initiation:${payload.applicationId}`
                ),
                Markup.button.callback(
                    texts.decline(),
                    `declline-application:${payload.applicationId}`
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
            if (!user?.provider.telegram) {
                throw new Error(
                    `User ${payload.targetUserId} does not use telegram`
                )
            }
            const l = toLocale(user.provider.telegram.locale)
            const texts = L[l].notifications.tribeAppliaction

            bot.telegram.sendMessage(
                user.provider.telegram.chatId,
                texts.declinedForApplicant({ tribe: payload.tribeName })
            )
        }
    )
}
