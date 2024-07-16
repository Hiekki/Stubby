import EventBase from '../../types/EventBase';
import { Events } from 'athena';
import Stubby from '../../Bot';

export default class Template extends EventBase {
    name: keyof Events = 'interactionCreate';
    enabled = true;

    async handle(caller: Stubby) {
        if (!this.enabled) return;
    }
}
