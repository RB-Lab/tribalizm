import inquirer from 'inquirer'
import { ITelegramUser, TelegramUserStore } from '../../telegram/users-adapter'

export async function listTgUsers(
    tgUsers: TelegramUserStore,
    back: () => Promise<void>
) {
    const fields: Array<keyof ITelegramUser> = [
        'id',
        'username',
        'chatId',
        'userId',
        'locale',
        'state',
    ]
    const answers = await inquirer.prompt<{
        fields: Array<keyof ITelegramUser>
    }>([
        {
            type: 'checkbox',
            name: 'fields',
            message: 'What fields to include?',
            choices: fields,
        },
    ])

    const users = await tgUsers.find({})
    console.table(
        users.map((t) =>
            answers.fields.reduce(
                (r, field) => ({ ...r, [field]: t[field] }),
                {}
            )
        )
    )
    return back()
}
