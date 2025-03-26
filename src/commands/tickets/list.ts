import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { ErrorMessage, Pagination } from '../../utils/message';
import { BotColors } from '../../utils/constants';
import moment from 'moment';

export default class List extends Command<Stubby> {
    id = 'list';
    definition = new CommandBuilder('list', 'List all tickets in this server')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild]);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            if (!command.guild) return;

            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            const permissions = await caller.parsing.botPermissionsCheck(command, [
                'ManageThreads',
                'CreatePrivateThreads',
                'SendMessagesInThreads',
            ]);
            if (permissions) return;

            const list = await caller.database.tickets.list(command.guild.id);
            if (!list.length) return await ErrorMessage(command, "I couldn't find any tickets in this server.", true);

            const pages: Constants.APIEmbed[] = list.map((ticket) => {
                return {
                    title: ticket.title,
                    description: `**Ticket ID:** ${ticket.id}\n**Channel:** <#${ticket.channelID}>\n**Description:** ${ticket.description.length > 30 ? `${ticket.description.substring(0, 27)}...` : ticket.description}\n**Created:** <t:${moment(ticket.createdAt).unix()}>\n**Updated:** <t:${moment(ticket.updatedAt).unix()}>\n\n[**Jump to Ticket**](https://discord.com/channels/${ticket.guildID}/${ticket.channelID}/${ticket.id})`,
                    color: BotColors.purple,
                    thumbnail: {
                        url: command.guild?.iconURL ?? '',
                    },
                    fields: ticket.categories.map((category) => ({
                        name: `__${category.label}__`,
                        value: `>>> **Description:** ${category.description}\n**Role One:** <@&${category.role_one}>${category.role_two ? `\n**Role Two:** <@&${category.role_two}>` : ''}${category.role_three ? `\n**Role Three:** <@&${category.role_three}>` : ''}${category.emoji ? `\n**Emoji:** ${category.emoji}` : ''}${category.custom_message ? `\n**Custom Message:** ${category.custom_message.substring(0, 25)}${category.custom_message.length > 25 ? '...' : ''}` : ''}`,
                    })),
                    footer: {
                        text: `${caller.bot.user?.username} • Tickets`,
                        icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                    },
                    timestamp: new Date().toISOString(),
                };
            });

            await Pagination(caller, pages, command, user.id, true, pages.length >= 3, true);
        } catch (error) {
            await caller.parsing.commandError(error, command, this.id);
        }
    }
}
