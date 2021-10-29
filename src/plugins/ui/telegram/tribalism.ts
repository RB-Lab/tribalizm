import { ContextUser } from '../../..//use-cases/utils/context-user'
import { TribeApplication } from '../../../use-cases/apply-tribe'
import { TribeShow } from '../../../use-cases/tribes-show'

export interface Tribalizm {
    tribesShow: Omit<TribeShow, keyof ContextUser>
    tribeApplication: Omit<TribeApplication, keyof ContextUser>
}