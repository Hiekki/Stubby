import EventBase from '../../types/EventBase';
import { Events, ThreadChannel } from 'athena';
import Stubby from '../../Bot';
import { BotEmojis } from '../../utils/constants';

export default class ThreadDelete extends EventBase {
    name: keyof Events = 'threadDelete';
    enabled = true;

    async handle(caller: Stubby, thread: ThreadChannel) {
        if (!this.enabled) return;

        const guild = await caller.database.guild.get(thread.guild.id);
        if (!guild) return;

        const dbThread = await caller.database.threads.get(thread.id);
        if (!dbThread) return;

        if (guild.logsChannel) {
            await caller.bot.createMessage(guild.logsChannel, {
                content: `[<t:${caller.parsing.unix()}:f>] ${BotEmojis.redX.full} A ticket was deleted: **${thread.name}**`,
            });
        }

        await caller.database.threads.delete(thread.id);
    }
}
