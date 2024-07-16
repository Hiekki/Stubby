import EventBase from '../../types/EventBase';
import { Events } from 'athena';
import Stubby from '../../Bot';

export default class Error extends EventBase {
    name: keyof Events = 'error';
    enabled = true;

    async handle(caller: Stubby, error: Error) {
        if (!this.enabled) return;

        caller.logger.error(error);
    }
}
