import inquirer from 'inquirer'
import { ITribeData } from '../../../../use-cases/entities/tribe'
import { Context } from '../../../../use-cases/utils/context'

export async function listTribes(context: Context, back: () => Promise<void>) {
    const fields: Array<keyof ITribeData> = [
        'id',
        'name',
        'description',
        'cityId',
        'chiefId',
        'shamanId',
        'logo',
        'vocabulary',
    ]
    const answers = await inquirer.prompt<{ fields: Array<keyof ITribeData> }>([
        {
            type: 'checkbox',
            name: 'fields',
            message: 'What fields to include?',
            choices: fields,
        },
    ])

    const tribes = await context.stores.tribeStore.findSimple({})
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
