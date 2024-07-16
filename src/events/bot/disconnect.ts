import EventBase from '../../types/EventBase';
import { Events } from 'athena';
import Stubby from '../../Bot';

export default class Disconnect extends EventBase {
    name: keyof Events = 'disconnect';
    enabled = true;

    async handle(caller: Stubby) {
        if (!this.enabled) return;

        caller.logger.warning('Bot disconnected.');
    }
}
