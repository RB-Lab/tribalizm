import { Admin } from '../../../use-cases/admin'
import { Context } from '../../../use-cases/utils/context'
import { TelegramUserStore } from '../telegram/users-adapter'
import inquirer from 'inquirer'

export async function admin(
    context: Context,
    tgUsers: TelegramUserStore,
    toggle: () => void
) {
    const admin = new Admin(context)

    enum MainMenu {
        listTribes = 'list tribes',
        listTgUsers = 'list telegram users',
        listMembers = 'list tribes members',
        addMember = 'add tribe member',
        toggle = 'toggle users discovery',
    }
    interface MainPrompt {
        mainMenu: MainMenu
    }
    async function mainMenu() {
        const answers = await inquirer.prompt<MainPrompt>([
            {
                type: 'list',
                name: 'mainMenu',
                message: 'whatever...',
                choices: [
                    MainMenu.listTribes,
                    MainMenu.listTgUsers,
                    MainMenu.listMembers,
                    MainMenu.addMember,
                    MainMenu.toggle,
                ],
            },
        ])

        if (answers.mainMenu === MainMenu.listTribes) {
            const tribes = await context.stores.tribeStore.find({})
            console.table(tribes.map((t) => ({ id: t.id, name: t.name })))
            mainMenu()
        } else if (answers.mainMenu === MainMenu.listTgUsers) {
            const users = await tgUsers.find({})
            console.table(
                users.map((u) => ({
                    id: u.id,
                    user: u.userId,
                    name: u.username,
                }))
            )
            mainMenu()
        } else if (answers.mainMenu === MainMenu.listMembers) {
            const members = await context.stores.memberStore.find({})
            console.table(
                members.map((m) => ({
                    id: m.id,
                    user: m.userId,
                    tribe: m.tribeId,
                    charism: m.charisma,
                }))
            )
            mainMenu()
        } else if (answers.mainMenu === MainMenu.addMember) {
            addMember()
        } else if (answers.mainMenu === MainMenu.toggle) {
            toggle()
            mainMenu()
        }
    }
    async function addMember() {
        interface AddMemberPrompt {
            tribe: string
            user: string
        }
        const answers = await inquirer.prompt<AddMemberPrompt>([
            {
                type: 'list',
                name: 'tribe',
                message: 'Which tirbe?',
                choices: (
                    await context.stores.tribeStore.find({})
                ).map((t) => `${t.name}@${t.id}`),
            },
            {
                type: 'list',
                name: 'user',
                message: 'Which user?',
                choices: (
                    await context.stores.userStore.find({})
                ).map((m) => `${m.name}@${m.id}`),
            },
        ])
        const tribeId = answers.tribe.split('@')[1]
        const userId = answers.user.split('@')[1]
        await admin.addTribeMember({ tribeId, userId })
        mainMenu()
    }

    mainMenu()
}
