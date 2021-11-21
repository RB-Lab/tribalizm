import {
    Application,
    ApplicationStore,
    IApplication,
} from '../../../use-cases/entities/application'
import { MongoStore } from './mongo-store'

export class MongoApplicationStore
    extends MongoStore<IApplication>
    implements ApplicationStore
{
    _class = Application
}
