import inquirer from 'inquirer'
import { Admin } from '../../../../use-cases/admin'
import { Context } from '../../../../use-cases/utils/context'
import autocomplete from 'inquirer-autocomplete-prompt'

export async function addTribe(context: Context, back: () => Promise<void>) {
    inquirer.registerPrompt('autocomplete', autocomplete)
    interface AddTribePrompt {
        city: string
        name: string
        description: string
    }
    const admin = new Admin(context)
    const answers = await inquirer.prompt<AddTribePrompt>([
        {
            type: 'autocomplete',
            name: 'city',
            message: 'In which city will we add a tribe?',
            source: async (_answers: AddTribePrompt, input?: string) => {
                const res = await context.stores.cityStore.autocomplete(input)
                return res.map((city) => ({ name: city.name, value: city.id }))
            },
        },
        {
            type: 'input',
            name: 'name',
            message: `What is tribe's name?`,
        },
        {
            type: 'input',
            name: 'description',
            message: `Tribe's description...`,
        },
    ])

    await admin.createTribe({
        cityId: answers.city,
        name: answers.name,
        description: answers.description,
    })
    return back()
}
