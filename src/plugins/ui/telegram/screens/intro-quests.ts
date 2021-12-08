import { Markup } from 'telegraf'
import { IntroMessage } from '../../../../use-cases/introduction-quests'
import { i18n } from '../../i18n/i18n-ctx'
import { TgContext } from '../tribe-ctx'
import { negotiate } from './quest-negotiation'

export function introQuestsScreen({ bot, bus, tgUsers }: TgContext) {
    bus.subscribe<IntroMessage>(
        'intro-request-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
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
