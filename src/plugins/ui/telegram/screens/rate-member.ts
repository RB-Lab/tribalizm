import { Markup } from 'telegraf'
import { RateElderMessage } from '../../../../use-cases/initiation'
import { RateMemberMessage } from '../../../../use-cases/quest-finale'
import { i18n } from '../../i18n/i18n-ctx'
import { removeInlineKeyboard } from '../telegraf-hacks'
import { TgContext } from '../tribe-ctx'
import { makeCallbackDataParser } from './callback-parser'

const parser = makeCallbackDataParser('rate', [
    'voteFor',
    'questId',
    'score',
    'charisma',
])

export function rateMemberScreen({ bot, bus, tgUsers }: TgContext) {
    bot.action(parser.regex, async (ctx) => {
        const texts = i18n(ctx).rateMember
        const data = parser.parse(ctx.match[0])

        if (data.charisma) {
            ctx.logEvent('rate-member', {
                questId: data.questId,
                charisma: data.charisma,
                wisdom: data.score,
            })
            await ctx.tribalizm.questFinale.finalize({
                userId: ctx.user.userId,
                questId: data.questId,
                votes: [
                    {
                        voteForId: data.voteFor,
                        charisma: Number(data.charisma),
                        wisdom: Number(data.score),
                    },
                ],
            })
            removeInlineKeyboard(ctx)
            await ctx.reply(texts.done())
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
            await ctx.editMessageText(
                texts.wisdomPrompt(),
                Markup.inlineKeyboard([
                    Markup.button.callback(texts.help(), 'help-topic:wisdom'),
                    ...keys,
                ])
            )
        }
    })

    // ================ Handle Notifications ===========
    bus.subscribe<RateElderMessage>(
        'rate-elder-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )
            const texts = i18n(user).rateMember
            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.charisma as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    parser.serialize({
                        score,
                        voteFor: payload.elderId,
                        questId: payload.questId,
                        charisma: null,
                    })
                )
            })
            await bot.telegram.sendMessage(
                user.chatId,
                texts.elderCharismaPrompt({
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
    bus.subscribe<RateMemberMessage>(
        'rate-member-message',
        async ({ payload }) => {
            const user = await tgUsers.getTelegramUserForTribalism(
                payload.targetUserId
            )

            const texts = i18n(user).rateMember
            const keys = [0, 1, 2, 3, 4].map((score) => {
                const text = (texts.charisma as any)[String(score)]()
                return Markup.button.callback(
                    text,
                    parser.serialize({
                        score,
                        voteFor: payload.memberId,
                        questId: payload.questId,
                        charisma: null,
                    })
                )
            })
            await bot.telegram.sendMessage(
                user.chatId,
                texts.charismaPrompt({ name: payload.memberName }),
                Markup.inlineKeyboard([
                    Markup.button.callback(texts.help(), 'help-topic:charisma'),
                    ...keys,
                ])
            )
        }
    )
}
