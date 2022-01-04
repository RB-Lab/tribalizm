import { Admin } from '../use-cases/admin'
import { createContext } from './test-context'

describe('Admin', () => {})

async function setUp() {
    const context = await createContext()

    const admin = new Admin(context)

    return {
        admin,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
