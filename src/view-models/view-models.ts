import { Stores } from '../use-cases/utils/context'
import { ApplicationViewModel } from './application'
import { UserViewModel } from './user'

export interface ViewModels {
    user: UserViewModel
    application: ApplicationViewModel
}

export function makeViewModels(stores: Stores) {
    return {
        user: new UserViewModel(stores),
        application: new ApplicationViewModel(stores)
    }
}
