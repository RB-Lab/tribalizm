import { Markup, Scenes, Telegraf } from 'telegraf'
import { ApplicationMessage } from '../../../../use-cases/apply-tribe'
import { QuestType } from '../../../../use-cases/entities/quest'
import {
    ApplicationApprovedMessage,
    ApplicationDeclinedMessage,
    RequestApplicationFeedbackMessage,
} from '../../../../use-cases/initiation'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { SceneState } from '../scene-state'
import { TelegramUsersAdapter } from '../users-adapter'
import { makeCalbackDataParser } from './calback-parser'

function scenes(tribalizm: Tribalizm) {
    const declineInitiaton = new Scenes.BaseScene<Scenes.SceneContext>(
        'declline-application'
    )
    const sceneState = new SceneState<{ questId: string; memberId: string }>()
    declineInitiaton.enter((ctx) => {
        const texts = i18n(ctx).initiation

        ctx.reply(texts.declinePrompt())
    })
    declineInitiaton.on('text', async (ctx) => {
        const texts = i18n(ctx).initiation
        ctx.reply(texts.declineOk())
        // TODO should use the text maybe?
        tribalizm.initiation.decline({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.scene.leave()
    })

    const appDecline = new Scenes.BaseScene<Scenes.SceneContext>(
        'application-decline'
    )
    appDecline.enter((ctx) => {
        tribalizm.initiation.decline({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.declineOk(),
            Markup.inlineKeyboard([])
        )
    })

    const appAccept = new Scenes.BaseScene<Scenes.SceneContext>(
        'application-accept'
    )
    appAccept.enter((ctx) => {
        tribalizm.initiation.approveByElder({
            questId: sceneState.get(ctx, 'questId'),
            elderUserId: ctx.state.userId,
        })
        ctx.editMessageText(
            i18n(ctx).initiation.approvedOk(),
            Markup.inlineKeyboard([])
        )
    })

    return [declineInitiaton, appDecline, appAccept]
}

const proposeParser = makeCalbackDataParser('propose-initiation', [
    'memberId',
    'questId',
    'elder',
])
const declineParser = makeCalbackDataParser('decline-application', [
    'memberId',
    'questId',
])

const acceptParser = makeCalbackDataParser('application-accept', [
    'memberId',
    'questId',
])
const appDeclineParser = makeCalbackDataParser('application-decline', [
    'memberId',
    'questId',
])

function actions(bot: Telegraf<Scenes.SceneContext>) {
    bot.action(proposeParser.regex, (ctx) => {
        const data = proposeParser.parse(ctx.match[0])
        ctx.scene.enter('quest-negotiation', {
            questId: data.questId,
            memberId: data.memberId,
            chiefInitiation: data.elder === 'chief',
            shamanInitiation: data.elder === 'shaman',
        })
    })

    // this is from the get-go, @see notifications/ApplicationMessage
    bot.action(declineParser.regex, (ctx) => {
        const data = declineParser.parse(ctx.match[0])
        ctx.scene.enter('declline-application', data)
    })

    bot.action(acceptParser.regex, (ctx) => {
        const data = acceptParser.parse(ctx.match[0])
        ctx.scene.enter('application-accept', data)
    })
    bot.action(appDeclineParser.regex, (ctx) => {
        const data = appDeclineParser.parse(ctx.match[0])
        ctx.scene.enter('application-decline', data)
    })
}

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
                    proposeParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                        elder: payload.elder,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    declineParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
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
    bus.subscribe<ApplicationDeclinedMessage>(
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
    bus.subscribe<RequestApplicationFeedbackMessage>(
        'request-application-feedback',
        async ({ payload }) => {
            const user = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            const kb = Markup.inlineKeyboard([
                Markup.button.callback(
                    texts.accept(),
                    acceptParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
                ),
                Markup.button.callback(
                    texts.decline(),
                    appDeclineParser.serialize({
                        memberId: payload.targetMemberId,
                        questId: payload.questId,
                    })
                ),
            ])

            const text = texts.feedbackRequest({
                name: payload.applicantName,
                tribe: payload.tribe,
            })

            bot.telegram.sendMessage(user.chatId, text, kb)
        }
    )

    bus.subscribe<ApplicationApprovedMessage>(
        'application-approved',
        async ({ payload }) => {
            const user = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const texts = i18n(user).initiation

            bot.telegram.sendMessage(
                user.chatId,
                texts.appliactionApproved({ tribe: payload.tribe })
            )
        }
    )
}

export const initiationScreen = { scenes, actions, attachNotifications }
