import {
    Application,
    ApplicationStore,
    IApplication,
} from '../../../use-cases/entities/application'
import { InMemoryStore } from './in-memory-store'

export class InMemoryApplicationStore
    extends InMemoryStore<IApplication>
    implements ApplicationStore
{
    _class = Application
}
