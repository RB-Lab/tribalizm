import { ContextUser } from './utils/context-user'

export class Admin extends ContextUser {
    declareBrainstorm() {
        throw new Error('Method not implemented.')
    }
}
