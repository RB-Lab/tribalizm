import inquirer from 'inquirer'
import { loadCities as loadCitiesScript } from '../../../../scripts/load-cities'
import { Context } from '../../../../use-cases/utils/context'

export async function loadCities(context: Context, back: () => Promise<void>) {
    interface LoadCitiesPrompt {
        path: string
    }
    const answers = await inquirer.prompt<LoadCitiesPrompt>([
        {
            type: 'input',
            name: 'path',
            message: `Enter location of the source file (.geojson) relative to ${process.cwd()}`,
            default: 'meta/cities.geojson',
        },
    ])

    await loadCitiesScript(answers.path, context.stores.cityStore)
    return back()
}
