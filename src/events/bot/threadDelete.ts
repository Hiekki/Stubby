import EventBase from '../../types/EventBase';
import { Events, ThreadChannel } from 'athena';
import Stubby from '../../Bot';

export default class ThreadDelete extends EventBase {
    name: keyof Events = 'threadDelete';
    enabled = true;

    async handle(caller: Stubby, thread: ThreadChannel) {
        if (!this.enabled) return;

        const dbThread = await caller.database.threads.get(thread.id);
        if (!dbThread) return;

        await caller.database.threads.delete(thread.id);
    }
}
