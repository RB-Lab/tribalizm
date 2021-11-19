import { Markup, Scenes, Telegraf } from 'telegraf'
import { ApplicationMessage } from '../../../use-cases/apply-tribe'
import { QuestType } from '../../../use-cases/entities/quest'
import { ApplicationDeclined } from '../../../use-cases/initiation'
import { QuestChangeMessage } from '../../../use-cases/negotiate-quest'
import { NotificationBus } from '../../../use-cases/utils/notification-bus'
import {
    NewCoordinationQuestMessage,
    NewIntroductionQuestMessage,
} from '../../../use-cases/utils/quest-message'
import { toLocale } from '../i18n/i18n-ctx'
import { L } from '../i18n/i18n-node'
import { TelegramUsersAdapter } from './users-adapter'

export function attachNotifications(
    bot: Telegraf<Scenes.SceneContext>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<ApplicationMessage>(
        'application-message',
        async ({ payload }) => {
            const elder = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const texts = i18n(elder).notifications.tribeAppliaction

            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.assignInitiation(),
                    `propose-initiation:${payload.targetMemberId}:${payload.qeuestId}`
                ),
                Markup.button.callback(
                    texts.decline(),
                    `decline-application:${payload.targetMemberId}:${payload.qeuestId}`
                ),
            ])

            bot.telegram.sendMessage(
                elder.chatId,
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
            const user = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const texts = i18n(user).notifications.tribeAppliaction

            bot.telegram.sendMessage(
                user.chatId,
                texts.applicationDeclined({ tribe: payload.tribeName })
            )
        }
    )
    bus.subscribe<QuestChangeMessage>(
        'quest-change-proposed',
        async ({ payload }) => {
            const user = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const qnTexts = i18n(user).questNegotiation

            const proposal = qnTexts.proposal({
                date: new Date(payload.time),
                place: payload.place,
            })
            let text = ''
            if (payload.questType === QuestType.initiation && payload.elder) {
                // X, shaman|chief of the tribe Y proposed to meet: ...
                const texts = i18n(user).initiation
                text = texts.questNotification({
                    elder: texts.elders[payload.elder](),
                    name: payload.proposingMemberName,
                    tribe: payload.tribe,
                    proposal,
                })
            } else {
                text = qnTexts.proposalRecieved({
                    who: payload.proposingMemberName,
                    proposal,
                    tribe: payload.tribe,
                    description: payload.description,
                })
            }

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    qnTexts.confirm(),
                    `agree-quest:${payload.targetMemberId}:${payload.questId}`
                ),
                Markup.button.callback(
                    qnTexts.proposeOther(),
                    `change-quest:${payload.targetMemberId}:${payload.questId}`
                ),
            ])

            bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )
    bus.subscribe<NewIntroductionQuestMessage>(
        'new-introduction-quest-message',
        async ({ payload }) => {
            // X, member of the tribe Y proposed to meet
        }
    )
    bus.subscribe<NewCoordinationQuestMessage>(
        'new-coordination-quest-message',
        async ({ payload }) => {
            // new quest Y! Meet with X to solve it
        }
    )
}

function i18n(user: { locale: string }) {
    return L[toLocale(user.locale)]
}
