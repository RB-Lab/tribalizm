import { Stores } from '../use-cases/utils/context'
import { UserViewModel } from './user'

export interface ViewModels {
    user: UserViewModel
}

export function makeViewModels(stores: Stores) {
    return {
        user: new UserViewModel(stores),
    }
}
