import { Markup, Telegraf } from 'telegraf'
import { IntroMessage } from '../../../../use-cases/introduction-quests'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter } from '../users-adapter'
import { negotiate } from './quest-negotiation'

export function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<IntroMessage>(
        'intro-request-message',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).introduction

            bot.telegram.sendMessage(
                user.chatId,
                texts.newMemberNotice({
                    name: payload.newMemberName,
                    tribe: payload.tribe,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(
                        texts.okay(),
                        negotiate.serialize({
                            memberId: payload.targetMemberId,
                            questId: payload.questId,
                            elder: null,
                        })
                    ),
                ])
            )
        }
    )
}

export const introQuests = { attachNotifications }
