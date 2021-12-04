import inquirer from 'inquirer'
import { Context } from '../../../use-cases/utils/context'
import { TelegramUserStore } from '../telegram/users-adapter'
import { addMember } from './prompts/add-member'
import { addTribe } from './prompts/add-tribe'
import { loadCities } from './prompts/load-cities'

export async function runAdmin(context: Context, tgUsers: TelegramUserStore) {
    enum MainMenu {
        listTribes = 'List tribes',
        listTgUsers = 'List telegram users',
        listMembers = 'List tribes members',
        addMember = 'Add tribe member',
        addTribe = 'Add tribe',
        loadCities = 'Load cities',
        exit = 'Exit',
    }
    interface MainPrompt {
        mainMenu: MainMenu
    }
    async function mainMenu() {
        const answers = await inquirer.prompt<MainPrompt>([
            {
                type: 'list',
                name: 'mainMenu',
                message: 'What should we do?',
                choices: Object.values(MainMenu),
            },
        ])

        switch (answers.mainMenu) {
            case MainMenu.listTribes:
                const tribes = await context.stores.tribeStore.find({})
                console.table(tribes.map((t) => ({ id: t.id, name: t.name })))
                return mainMenu()
            case MainMenu.listTgUsers:
                const users = await tgUsers.find({})
                console.table(
                    users.map((u) => ({
                        id: u.id,
                        user: u.userId,
                        name: u.username,
                    }))
                )
                return mainMenu()
            case MainMenu.listMembers:
                const members = await context.stores.memberStore.find({})
                console.table(
                    members.map((m) => ({
                        id: m.id,
                        user: m.userId,
                        tribe: m.tribeId,
                        charisma: m.charisma,
                    }))
                )
                return mainMenu()
            case MainMenu.addMember:
                return addMember(context, mainMenu)
            case MainMenu.addTribe:
                return addTribe(context, mainMenu)
            case MainMenu.loadCities:
                return loadCities(context, mainMenu)
            case MainMenu.exit:
                process.exit(0)
            default:
                console.error('Unknown main menu action')
                process.exit(1)
        }
    }

    return mainMenu()
}
