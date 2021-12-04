import inquirer from 'inquirer'
import { loadCities as loadCitiesScript } from '../../../../scripts/load-cities'
import { Context } from '../../../../use-cases/utils/context'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
const readDir = promisify(fs.readdir)

async function ls(dir: string) {
    const content = await readDir(dir, { withFileTypes: true })
    return content
        .filter((f) => f.isDirectory() || f.name.endsWith('.geojson'))
        .map((f) => ({
            name: f.isDirectory() ? `📁 ${f.name}` : f.name,
            value: path.join(dir, f.name),
        }))
}
export async function loadCities(context: Context, back: () => Promise<void>) {
    interface LoadCitiesPrompt {
        path: string
    }
    let filePath = process.cwd()
    while (!filePath.endsWith('.geojson')) {
        const answers = await inquirer.prompt<LoadCitiesPrompt>([
            {
                type: 'list',
                name: 'path',
                message: `Select a GeoJSON file with cities`,
                choices: [
                    { name: '📁 ..', value: path.dirname(filePath) },
                    ...(await ls(filePath)),
                ],
            },
        ])
        filePath = answers.path
    }

    await loadCitiesScript(filePath, context.stores.cityStore)
    return back()
}
