import EventBase from '../../types/EventBase';
import {
    BaseChannel,
    CategoryChannel,
    Events,
    ForumChannel,
    GuildChannel,
    GuildTextChannel,
    GuildVoiceChannel,
    MediaChannel,
    Message,
    NewsChannel,
    NewsThreadChannel,
    PartialChannel,
    PrivateChannel,
    ThreadChannel,
    VoiceTextChannel,
} from 'athena';
import Stubby from '../../Bot';

type ChannelTypes =
    | CategoryChannel
    | PrivateChannel
    | VoiceTextChannel
    | NewsChannel
    | NewsThreadChannel
    | ThreadChannel
    | GuildChannel
    | MediaChannel
    | BaseChannel
    | GuildTextChannel
    | GuildVoiceChannel
    | ForumChannel
    | PartialChannel;

export default class MessageDelete extends EventBase {
    name: keyof Events = 'messageDelete';
    enabled = true;

    async handle(
        caller: Stubby,
        message:
            | Message
            | {
                  id: string;
                  channel:
                      | ChannelTypes
                      | {
                            id: string;
                            guild?: {
                                id: string;
                            };
                        };
                  guildID?: string;
              },
    ) {
        if (!this.enabled) return;

        const dbTicket = await caller.database.tickets.get(message.id);
        if (!dbTicket) return;

        const guild = await caller.database.guild.get(dbTicket.guildID);
        if (!guild) return;

        if (guild.logsChannel) {
            await caller.bot.createMessage(guild.logsChannel, {
                content: `[<t:${caller.parsing.unix()}:f>] A ticket system embed was manually deleted: **${dbTicket.title}**`,
            });
        }

        await caller.database.tickets.delete(message.id);
    }
}
