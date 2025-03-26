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
import MiddleWareType from '../../types/MiddleWare';
import { ErrorMessage, SuccessMessage } from '../../utils/message';

export default class CustomMessage extends Command<Stubby> {
    id = 'custom_message';
    definition = new CommandBuilder('custom_message', 'Add or edit a custom message on a specific category')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addStringOption({
            name: 'ticket',
            description: 'The ticket to edit the category in',
            required: true,
            autocomplete: true,
        })
        .addStringOption({
            name: 'category',
            description: 'The category you wish to edit',
            required: true,
            autocomplete: true,
        });

    async handleCommand(caller: Stubby, command: CommandInteraction, middleware: MiddleWareType) {
        try {
            if (!command.guild) return;

            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            const ticketID = command.getRequiredString('ticket');
            const categoryID = command.getRequiredString('category');

            const ticket = await caller.database.tickets.get(ticketID);
            if (!ticket) return await ErrorMessage(command, 'Could not find ticket!', true);

            const category = await caller.database.categories.get(Number(categoryID));
            if (!category) return await ErrorMessage(command, 'Could not find category!', true);

            const modal = new ModalBuilder('Create Ticket', `custom_message:${ticketID}:${categoryID}`).addTextInput({
                label: `Custom Message for: ${category.label}`,
                value: category.custom_message ?? undefined,
                placeholder: `What custom message would you like to add to ${category.label}?`,
                custom_id: 'custom_message',
                max_length: 4000,
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

        const custom_message = interaction.fields.find((f) => f.custom_id == 'custom_message')!.value;

        const ticketID = params[1];
        const ticket = await caller.database.tickets.get(ticketID);
        if (!ticket) return await ErrorMessage(interaction, 'Could not find ticket!', true);

        const categoryID = Number(params[2]);
        const category = await caller.database.categories.get(categoryID);
        if (!category) return await ErrorMessage(interaction, 'Could not find category!', true);

        await caller.database.categories.update(categoryID, {
            custom_message,
        });

        if (middleware?.guild.logsChannel) {
            await caller.bot.createMessage(middleware.guild.logsChannel, {
                content: `[<t:${caller.parsing.unix()}:f>] ✏️ ${user.mention} (\`${user.id}\`) edited a custom message in **${ticket.title}**: **${category.label}**`,
            });
        }

        await SuccessMessage(interaction, `Successfully edited the custom message in **${ticket.title}**: **${category.label}**`, true);
    }

    async handleAutocomplete(caller: Stubby, interaction: AutocompleteInteraction) {
        if (!interaction.guild) return;

        const focused = interaction.focused();
        switch (focused?.name) {
            case 'ticket': {
                const focusedValue = focused?.value as string;
                const tickets = await caller.database.tickets.allGuild(interaction.guild.id);
                const results = tickets
                    .filter((ticket) => ticket.title.toLowerCase().includes(focusedValue.toLowerCase()))
                    .map((ticket) => {
                        return { name: ticket.title, value: ticket.id };
                    })
                    .slice(0, 25);
                await interaction.acknowledge(results);
                break;
            }
            case 'category': {
                const ticketID = interaction.options[0].value as string;
                if (!ticketID) return await interaction.acknowledge([{ name: 'Please select a ticket first.', value: '0' }]);

                const focusedValue = focused?.value as string;
                const categories = await caller.database.categories.allMessage(ticketID);
                const results = categories
                    .filter((category) => category.label.toLowerCase().includes(focusedValue.toLowerCase()))
                    .map((category) => {
                        return { name: category.label, value: `${category.id}` };
                    })
                    .slice(0, 25);

                await interaction.acknowledge(results);
                break;
            }
        }
    }
}
