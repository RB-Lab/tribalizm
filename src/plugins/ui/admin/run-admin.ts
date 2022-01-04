import inquirer from 'inquirer'
import { Context } from '../../../use-cases/utils/context'
import { TelegramUserStore } from '../telegram/users-adapter'
import { listMembers } from './prompts/list-members'
import { listTgUsers } from './prompts/list-tg-users'
import { listTribes } from './prompts/list-tribes'
import { loadCities } from './prompts/load-cities'

export async function runAdmin(context: Context, tgUsers: TelegramUserStore) {
    enum MainMenu {
        listTribes = 'List tribes',
        listTgUsers = 'List telegram users',
        listMembers = 'List tribes members',
        loadCities = 'Load cities',
        exit = 'Exit',
    }
    async function mainMenu(): Promise<void> {
        const answers = await inquirer.prompt<{ mainMenu: MainMenu }>([
            {
                type: 'list',
                name: 'mainMenu',
                message: 'What should we do?',
                choices: Object.values(MainMenu),
            },
        ])

        switch (answers.mainMenu) {
            case MainMenu.listTribes:
                return listTribes(context, mainMenu)
            case MainMenu.listTgUsers:
                return listTgUsers(tgUsers, mainMenu)
            case MainMenu.listMembers:
                return listMembers(context, mainMenu)
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
