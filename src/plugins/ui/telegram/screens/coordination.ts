import { Markup, Telegraf } from 'telegraf'
import { IdeaIncarnationMessage } from '../../../../use-cases/incarnate-ideas'
import { CoordinationQuestAcceptedMessage } from '../../../../use-cases/negotiate-quest'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TribeCtx } from '../tribe-ctx'
import { TelegramUsersAdapter } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

const parser = makeCalbackDataParser('arrage-coordination', [
    'memberId',
    'questId',
])

function actions(bot: Telegraf<TribeCtx>) {
    bot.action(parser.regex, (ctx) => {
        const data = parser.parse(ctx.match[0])
        ctx.scene.enter('quest-negotiation', {
            questId: data.questId,
            memberId: data.memberId,
        })
    })
}

const spawnParser = makeCalbackDataParser('spawn-quest', [
    'questId',
    'memberId',
])
const gatherParser = makeCalbackDataParser('declare-gathering', [
    'questId',
    'memberId',
    'type',
])
const reQuestParser = makeCalbackDataParser('re-quest', ['questId', 'memberId'])

function attachNotifications(
    bot: Telegraf<TribeCtx>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<IdeaIncarnationMessage>(
        'idea-incarnation',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).coordination

            bot.telegram.sendMessage(
                user.chatId,
                texts.coordinateOwnIdea({
                    name: payload.partner,
                    description: payload.description,
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
    bus.subscribe<CoordinationQuestAcceptedMessage>(
        'coordination-quest-accepted',
        async ({ payload }) => {
            const user = await telegramUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const { buttons, questManage } = i18n(user).coordination
            const partner = payload.members.filter(
                (m) => m.id !== payload.targetMemberId
            )[0]

            const params = {
                memberId: payload.targetMemberId,
                questId: payload.questId,
            }
            // TODO Remove buttons, when show "how was it"
            const kb = Markup.inlineKeyboard(
                [
                    Markup.button.callback(
                        buttons.spawn(),
                        spawnParser.serialize(params)
                    ),
                    Markup.button.callback(
                        buttons.reQuest(),
                        reQuestParser.serialize(params)
                    ),
                    Markup.button.callback(
                        buttons.gatherUpwoters(),
                        gatherParser.serialize({
                            ...params,
                            type: 'upvoters',
                        })
                    ),
                    Markup.button.callback(
                        buttons.gatherTribe(),
                        gatherParser.serialize({
                            ...params,
                            type: 'all',
                        })
                    ),
                ],
                { columns: 2 }
            )
            bot.telegram.sendMessage(
                user.chatId,
                questManage({ name: partner.name }),
                kb
            )
        }
    )
}

export const coordinationScreen = { attachNotifications, actions }
