import { AutocompleteInteraction, Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { ConfirmAction, ErrorMessage } from '../../utils/message';
import { BotColors, BotEmojis } from '../../utils/constants';
import moment from 'moment';
import MiddleWareType from '../../types/MiddleWare';

export default class Delete extends Command<Stubby> {
    id = 'delete';
    definition = new CommandBuilder('delete', 'Delete a ticket system')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addStringOption({ name: 'ticket', description: 'The ticket to delete', required: true, autocomplete: true });

    async handleCommand(caller: Stubby, command: CommandInteraction, middleware: MiddleWareType) {
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

            const ticketID = command.getRequiredString('ticket');
            const ticket = await caller.database.tickets.get(ticketID);
            if (!ticket) return await ErrorMessage(command, 'Could not find ticket!', true);

            const deleteMessage = await ConfirmAction(caller, command, {
                embeds: [
                    {
                        title: 'Delete Ticket',
                        description: `Are you sure you want to delete the ticket \`${ticket.title}\`?\n\n-# This command will timeout <t:${moment(Date.now()).add(1, 'minute').add(1, 'seconds').unix()}:R>`,
                        color: BotColors.purple,
                    },
                ],
                flags: Constants.MessageFlags.Ephemeral,
            });

            if (deleteMessage.timeout) {
                return await command.editOriginalMessage({
                    embeds: [
                        {
                            title: `Delete Ticket: Timed Out ${BotEmojis.yellowBang.full}`,
                            description: 'You took too long to decide!',
                            color: BotColors.yellow,
                        },
                    ],
                    components: [],
                });
            }

            const confirmed = deleteMessage.result;

            if (confirmed) {
                try {
                    await caller.bot.deleteMessage(ticket.channelID, ticket.id);
                    if (middleware?.guild.logsChannel) {
                        await caller.bot.createMessage(middleware.guild.logsChannel, {
                            content: `[<t:${caller.parsing.unix()}:f>] 🗑️ ${user.mention} (\`${user.id}\`) deleted a ticket system in <#${ticket.channelID}>: **${ticket.title}**`,
                        });
                    }
                } catch (error) {
                    caller.logger.error(error);
                    return await ErrorMessage(command, 'Failed to delete ticket!', true);
                }
            }

            await command.editOriginalMessage({
                embeds: [
                    {
                        title: `Delete Ticket: ${confirmed ? `Success ${BotEmojis.greenTick.full}` : `Cancelled ${BotEmojis.redX.full}`}`,
                        description: confirmed ? `Successfully deleted ticket!` : `The request to delete the ticket has been cancelled.`,
                        color: confirmed ? BotColors.green : BotColors.red,
                    },
                ],
                components: [],
            });
        } catch (error) {
            await caller.parsing.commandError(error, command, this.id);
        }
    }

    async handleAutocomplete(caller: Stubby, interaction: AutocompleteInteraction) {
        if (!interaction.guild) return;

        const focusedValue = interaction.focused()?.value as string;
        const tickets = await caller.database.tickets.allGuild(interaction.guild.id);
        const results = tickets
            .filter((ticket) => ticket.title.toLowerCase().includes(focusedValue.toLowerCase()))
            .map((ticket) => {
                return { name: ticket.title, value: ticket.id };
            })
            .slice(0, 25);
        await interaction.acknowledge(results);
    }
}
