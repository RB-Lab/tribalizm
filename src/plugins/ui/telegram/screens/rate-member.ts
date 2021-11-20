import { Markup, Scenes, Telegraf } from 'telegraf'
import { RateElderMessage } from '../../../../use-cases/initiation'
import { Tribalizm } from '../../../../use-cases/tribalism'
import { NotificationBus } from '../../../../use-cases/utils/notification-bus'
import { i18n } from '../../i18n/i18n-ctx'
import { TelegramUsersAdapter } from '../users-adapter'

const parser = makeCalbackDataParser('rate-member', [
    'memberId',
    'voteFor',
    'questId',
    'score',
    'charisma',
])

// TODO add constarin so that T's values are only strings
function makeCalbackDataParser<T>(cbName: string, keys: Array<keyof T>) {
    return {
        serialize: (data: T) => {
            const cbData = keys
                .map((k) => {
                    const value = data[k]
                    if (typeof value === 'string' && value.includes(':')) {
                        throw new Error(
                            `Cannot make callback data, invalid character: ${data[k]}`
                        )
                    }
                    return value
                })
                .join(':')
            return `${cbName}:${cbData}`
        },
        parse: (str: string) => {
            const arr = str.replace(`${cbName}:`, '').split(':')
            return keys.reduce<T>((r, k, i) => ({ ...r, [k]: arr[i] }), {} as T)
        },
        regex: () => {
            return new RegExp(`${cbName}:(.+)`)
        },
    }
}

function actions(bot: Telegraf<Scenes.SceneContext>, tribalism: Tribalizm) {
    bot.action(parser.regex(), (ctx) => {
        const texts = i18n(ctx).rateMember
        const data = parser.parse(ctx.match[0])

        if (data.charisma) {
            tribalism.questFinale.finalyze({
                memberId: data.memberId,
                questId: data.questId,
                votes: [
                    {
                        voteForId: data.voteFor,
                        charisma: Number(data.charisma),
                        wisdom: Number(data.score),
                    },
                ],
            })
            ctx.reply(texts.done())
        } else {
            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.wisdom as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    parser.serialize({
                        ...data,
                        charisma: data.score,
                        score,
                    })
                )
            })
            ctx.editMessageText(
                texts.wisdomPrompt(),
                Markup.inlineKeyboard([
                    Markup.button.callback(texts.help(), 'help-topic:wisdom'),
                    ...keys,
                ])
            )
        }
    })
}

export function attachNotifications(
    bot: Telegraf<Scenes.SceneContext>,
    bus: NotificationBus,
    telegramUsers: TelegramUsersAdapter
) {
    bus.subscribe<RateElderMessage>(
        'rate-elder-message',
        async ({ payload }) => {
            const user = await telegramUsers.getCatDataByUserId(
                payload.targetUserId
            )
            const texts = i18n(user).rateMember
            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.charisma as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    parser.serialize({
                        memberId: payload.targetMemberId,
                        score,
                        voteFor: payload.elderId,
                        questId: payload.questId,
                        charisma: null,
                    })
                )
            })
            bot.telegram.sendMessage(
                user.chatId,
                texts.charismaPrompt({
                    elder: i18n(user).elders[payload.elder](),
                    tribe: payload.tribe,
                }),
                Markup.inlineKeyboard([
                    Markup.button.callback(texts.help(), 'help-topic:charisma'),
                    ...keys,
                ])
            )
        }
    )
}

export const rateMemberScreen = { actions, attachNotifications }
