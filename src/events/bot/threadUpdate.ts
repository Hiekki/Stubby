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

        const guild = await caller.database.guild.get(thread.guild.id);
        if (!guild) return;

        const dbThread = await caller.database.threads.get(thread.id);
        if (!dbThread) return;

        if (thread.threadMetadata) {
            await caller.database.threads.update(thread.id, {
                closed: thread.threadMetadata.archived,
                locked: thread.threadMetadata.locked ?? dbThread.locked,
            });

            if (guild.logsChannel) {
                if (thread.threadMetadata.locked !== dbThread.locked && thread.threadMetadata.locked != old?.threadMetadata?.locked) {
                    await caller.bot.createMessage(guild.logsChannel, {
                        content: `[<t:${caller.parsing.unix()}:f>] ${thread.threadMetadata.locked ? '🔒' : '🔓'} A ticket was manually ${
                            thread.threadMetadata.locked ? 'locked' : 'unlocked'
                        }: **${thread.name}**`,
                    });
                } else if (
                    thread.threadMetadata.archived !== dbThread.closed &&
                    thread.threadMetadata.archived != old?.threadMetadata?.archived
                ) {
                    await caller.bot.createMessage(guild.logsChannel, {
                        content: `[<t:${caller.parsing.unix()}:f>] ${thread.threadMetadata.archived ? '📨' : '📫'} A ticket was manually ${
                            thread.threadMetadata.archived ? 'closed' : 're-opened'
                        }: **${thread.name}**`,
                    });
                }
            }
        }
    }
}
