import { Command, CommandBuilder, CommandInteraction, Constants, ModalBuilder, ModalSubmitInteraction } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants';
import { ErrorMessage, MissingPermissionsMessage, SuccessMessage } from '../../utils/message';
import { AllPermissions } from '../../types/Permissions';
import MiddleWareType from '../../types/MiddleWare';

export default class Create extends Command<Stubby> {
    id = 'create';
    definition = new CommandBuilder('create', 'Create a new ticket system')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addChannelOption('channel', 'The channel to create the ticket in', true, [Constants.ChannelType.GuildText]);

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

            const channel = command.getRequiredChannel('channel');
            if (channel?.isTextBased() && channel.inGuild()) {
                const botPermissions = channel.permissionsOf(caller.bot.user.id);
                const missingPermissions = botPermissions.missing('SendMessages', 'ViewChannel');
                if (missingPermissions.length) {
                    return await MissingPermissionsMessage(command, missingPermissions as AllPermissions[], true);
                }
            }

            const modal = new ModalBuilder('Create Ticket', `create:${channel.id}`)
                .addTextInput({
                    label: 'Title',
                    placeholder: 'What is the title of the ticket?',
                    custom_id: 'title',
                    max_length: 64,
                    style: Constants.TextInputStyle.Short,
                    required: true,
                })
                .addTextInput({
                    label: 'Description',
                    placeholder: 'What is the description of the ticket?',
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

        const channelID = params[1];

        try {
            const message = await caller.bot.createMessage(channelID, {
                embeds: [
                    {
                        author: {
                            icon_url: user.dynamicAvatarURL(),
                            name: user.displayName(true),
                        },
                        title,
                        description,
                        color: BotColors.purple,
                        thumbnail: {
                            url: interaction.guild.iconURL ?? '',
                        },
                        footer: {
                            text: `${caller.bot.user?.username} • Tickets`,
                            icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                        },
                        timestamp: new Date().toISOString(),
                    },
                ],
            });

            const ticket = await caller.database.tickets.create({
                id: message.id,
                guild: { connect: { guildID: interaction.guild.id } },
                channelID: channelID,
                title,
                description,
            });

            if (middleware?.guild.logsChannel) {
                await caller.bot.createMessage(middleware.guild.logsChannel, {
                    content: `[<t:${caller.parsing.unix()}:f>] 🖊️ ${user.mention} (\`${user.id}\`) created a new ticket system in <#${ticket.channelID}>: **${ticket.title}**`,
                });
            }
        } catch (error) {
            caller.logger.error(error);
            return await ErrorMessage(interaction, 'Failed to create ticket!', true);
        }

        await SuccessMessage(interaction, `Successfully created the ticket in <#${channelID}>!`, true);
    }
}
