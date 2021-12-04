import inquirer from 'inquirer'
import { IMemberData } from '../../../../use-cases/entities/member'
import { Context } from '../../../../use-cases/utils/context'

export async function listMembers(context: Context, back: () => Promise<void>) {
    const fields: Array<keyof IMemberData> = [
        'id',
        'tribeId',
        'charisma',
        'isCandidate',
        'userId',
        'votes',
        'wisdom',
    ]
    const answers = await inquirer.prompt<{ fields: Array<keyof IMemberData> }>(
        [
            {
                type: 'checkbox',
                name: 'fields',
                message: 'What fields to include?',
                choices: fields,
            },
        ]
    )

    const tribes = await context.stores.memberStore.find({})
    console.table(
        tribes.map((t) =>
            answers.fields.reduce(
                (r, field) => ({ ...r, [field]: t[field] }),
                {}
            )
        )
    )
    return back()
}
