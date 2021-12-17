import inquirer from 'inquirer'
import { Admin } from '../../../../use-cases/admin'
import { Context } from '../../../../use-cases/utils/context'

export async function addMember(context: Context, back: () => Promise<void>) {
    interface AddMemberPrompt {
        tribe: string
        user: string
    }
    const admin = new Admin(context)
    const answers = await inquirer.prompt<AddMemberPrompt>([
        {
            type: 'list',
            name: 'tribe',
            message: 'Which tribe?',
            choices: (
                await context.stores.tribeStore.findSimple({})
            ).map((t) => `${t.name}@${t.id}`),
        },
        {
            type: 'list',
            name: 'user',
            message: 'Which user?',
            choices: (
                await context.stores.userStore.findSimple({})
            ).map((m) => `${m.name}@${m.id}`),
        },
    ])
    const tribeId = answers.tribe.split('@')[1]
    const userId = answers.user.split('@')[1]
    await admin.addTribeMember({ tribeId, userId })
    return back()
}
