import {
    AutocompleteInteraction,
    Command,
    CommandBuilder,
    CommandInteraction,
    Constants,
    ModalBuilder,
    ModalSubmitInteraction,
} from 'athena';
import Stubby from '../../Bot';
import { ErrorMessage, SuccessMessage } from '../../utils/message';
import MiddleWareType from '../../types/MiddleWare';

export default class Edit extends Command<Stubby> {
    id = 'edit';
    definition = new CommandBuilder('edit', 'Edit a ticket system')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addStringOption({ name: 'ticket', description: 'The ticket to edit', required: true, autocomplete: true });

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

            const ticketID = command.getRequiredString('ticket');
            const ticket = await caller.database.tickets.get(ticketID);
            if (!ticket) return await ErrorMessage(command, 'Could not find ticket!', true);

            const message = await caller.bot.getMessage(ticket.channelID, ticket.id);
            if (!message) return await ErrorMessage(command, 'Could not find a message to edit!', true);

            const modal = new ModalBuilder('Edit Ticket', `edit:${ticketID}`)
                .addTextInput({
                    label: 'Title',
                    placeholder: 'What is the title of the ticket?',
                    value: ticket.title,
                    custom_id: 'title',
                    max_length: 64,
                    style: Constants.TextInputStyle.Short,
                    required: true,
                })
                .addTextInput({
                    label: 'Description',
                    placeholder: 'What is the description of the ticket?',
                    value: ticket.description,
                    custom_id: 'description',
                    max_length: 2048,
                    style: Constants.TextInputStyle.Paragraph,
                    required: true,
                });

            await command.createModal(modal.toJSON());
        } catch (error) {
            await caller.parsing.commandError(error, command, this.id);
        }
    }

    async handleModal(caller: Stubby, interaction: ModalSubmitInteraction, middleware: MiddleWareType) {
        if (!interaction.guild) return;
        const user = interaction.member ? interaction.member.user : interaction.user;
        if (!user) return;

        const params = interaction.data.custom_id.split(':');

        const title = interaction.fields.find((f) => f.custom_id == 'title')!.value;
        const description = interaction.fields.find((f) => f.custom_id == 'description')!.value;

        const ticketID = params[1];

        const ticket = await caller.database.tickets.get(ticketID);
        if (!ticket) return await ErrorMessage(interaction, 'Could not find ticket!', true);

        const message = await caller.bot.getMessage(ticket.channelID, ticket.id);
        if (!message) return await ErrorMessage(interaction, 'Could not find a message to edit!', true);

        try {
            const fast_copy: Constants.APIEmbed = JSON.parse(JSON.stringify(message.embeds[0]));
            fast_copy.title = title;
            fast_copy.description = description;
            fast_copy.author = {
                icon_url: user.dynamicAvatarURL(),
                name: user.displayName(true),
            };
            fast_copy.thumbnail = {
                url: interaction.guild.iconURL ?? '',
            };
            fast_copy.footer = {
                text: `${caller.bot.user?.username} • Tickets`,
                icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
            };
            fast_copy.timestamp = new Date().toISOString();

            await caller.bot.editMessage(ticket.channelID, ticket.id, { embeds: [fast_copy] });

            if (middleware?.guild.logsChannel) {
                await caller.bot.createMessage(middleware.guild.logsChannel, {
                    content: `[<t:${caller.parsing.unix()}:f>] ✏️ ${user.mention} (\`${user.id}\`) edited a ticket system in <#${ticket.channelID}>: **${title}**\n**Old Title:** ${ticket.title}\n**New Title:** ${title}\n**Old Description:** \`\`\`${ticket.description}\`\`\`**New Description:** \`\`\`${description}\`\`\``,
                });
            }

            await caller.database.tickets.update(ticketID, {
                title,
                description,
            });
        } catch (error) {
            caller.logger.error(error);
            return await ErrorMessage(interaction, 'Failed to edit ticket!', true);
        }

        await SuccessMessage(
            interaction,
            `Successfully edited the ticket: https://discord.com/channels/${ticket.guildID}/${ticket.channelID}/${ticket.id}`,
            true,
        );
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
