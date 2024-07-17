import EventBase from '../../types/EventBase';
import { Events, ThreadChannel } from 'athena';
import Stubby from '../../Bot';

export default class ThreadUpdate extends EventBase {
    name: keyof Events = 'threadUpdate';
    enabled = true;

    async handle(
        caller: Stubby,
        thread: ThreadChannel,
        old?: {
            name: string;
            rateLimitPerUser: number | null;
            threadMetadata:
                | {
                      archiveTimestamp: number;
                      archived: boolean;
                      autoArchiveDuration: number;
                      locked?: boolean | undefined;
                      invitable?: boolean | undefined;
                  }
                | undefined;
        } | null,
    ) {
        if (!this.enabled) return;
        const dbThread = await caller.database.threads.get(thread.id);
        if (!dbThread) return;

        if (thread.threadMetadata?.archived) await caller.database.threads.update(thread.id, { closed: true, locked: false });
        else if (thread.threadMetadata?.locked) await caller.database.threads.update(thread.id, { closed: true, locked: true });

        if (!thread.threadMetadata?.archived && dbThread.closed) {
            await caller.database.threads.update(thread.id, { closed: false, locked: false });
        }
    }
}
