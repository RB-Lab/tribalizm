import { ContextUser } from './utils/context-user'
import { TribeApplication } from './apply-tribe'
import { Initiation } from './initiation'
import { TribeShow } from './tribes-show'

export interface Tribalizm {
    tribesShow: Omit<TribeShow, keyof ContextUser>
    tribeApplication: Omit<TribeApplication, keyof ContextUser>
    initiation: Omit<Initiation, keyof ContextUser>
}
