import { Stores } from '../use-cases/utils/context'
import { ApplicationViewModel } from './application'
import { TribeViewModel } from './tribe'
import { UserViewModel } from './user'

export interface ViewModels {
    user: UserViewModel
    application: ApplicationViewModel
    tribe: TribeViewModel
}

export function makeViewModels(stores: Stores): ViewModels {
    return {
        user: new UserViewModel(stores),
        application: new ApplicationViewModel(stores),
        tribe: new TribeViewModel(stores),
    }
}
