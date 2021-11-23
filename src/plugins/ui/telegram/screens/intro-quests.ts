import { Markup, Scenes, Telegraf } from 'telegraf'
import { RateElderMessage } from '../../../../use-cases/initiation'
import { IntroMessage } from '../../../../use-cases/introduction-quests'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

const parser = makeCalbackDataParser('arrage-intro', ['memberId', 'questId'])

function actions(bot: Telegraf<TribeCtx>) {
    bot.action(parser.regex, (ctx) => {
        const data = parser.parse(ctx.match[0])
        ctx.scene.enter('quest-negotiation', {
            questId: data.questId,
            memberId: data.memberId,
        })
    })
}

export function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<IntroMessage>(
        'intro-request-message',
        async ({ payload }) => {
            const user = await telegramUsers.getChatDataByUserId(
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
                        parser.serialize({
                            memberId: payload.targetMemberId,
                            questId: payload.questId,
                        })
                    ),
                ])
            )
        }
    )
}

export const introQuests = { actions, attachNotifications }
