import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { ErrorMessage, SuccessMessage } from '../../utils/message';

export default class Close extends Command<Stubby> {
    id = 'close';
    definition = new CommandBuilder('close', 'Close an individual ticket')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addBooleanOption('delete', 'Delete the ticket permanently')
        .addBooleanOption('lock', 'Lock the ticket so that it cannot be talked in anymore');

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

            const channel = await caller.bot.getChannel(command.channel.id);
            if (!channel?.isThread()) return await ErrorMessage(command, 'This command can only be used in a ticket thread.', true);

            const isDelete = command.getBoolean('delete');
            const isLock = command.getBoolean('lock');

            if (isDelete) {
                try {
                    await SuccessMessage(command, `Ticket will be deleted in 5 seconds.`);

                    setTimeout(async () => {
                        await caller.bot.deleteChannel(channel.id);
                    }, 5 * 1000);
                } catch (error) {
                    caller.logger.error(error);
                    return await ErrorMessage(command, 'Failed to delete ticket!', true);
                }
            } else {
                try {
                    await SuccessMessage(command, `Ticket will be closed in 5 seconds.`);

                    setTimeout(async () => {
                        await channel.edit({
                            archived: true,
                            locked: isLock ?? false,
                        });
                    }, 5 * 1000);
                } catch (error) {
                    caller.logger.error(error);
                    return await ErrorMessage(command, 'Failed to lock ticket!', true);
                }
            }
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
