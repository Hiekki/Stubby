import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { ErrorMessage, SuccessMessage } from '../../utils/message';
import MiddleWareType from '../../types/MiddleWare';

export default class Close extends Command<Stubby> {
    id = 'close';
    definition = new CommandBuilder('close', 'Close an individual ticket')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addBooleanOption('delete', 'Delete the ticket permanently')
        .addBooleanOption('lock', 'Lock the ticket so that it cannot be talked in anymore');

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

            const channel = await caller.bot.getChannel(command.channel.id);
            if (!channel?.isThread()) return await ErrorMessage(command, 'This command can only be used in a ticket thread.', true);

            const isDelete = command.getBoolean('delete');
            const isLock = command.getBoolean('lock');

            if (isDelete) {
                try {
                    await SuccessMessage(command, `Ticket will be deleted in 5 seconds.`);

                    if (middleware?.guild.logsChannel) {
                        await caller.bot.createMessage(middleware.guild.logsChannel, {
                            content: `[<t:${caller.parsing.unix()}:f>] 🗑️ ${user.mention} (\`${user.id}\`) deleted a ticket: **${channel.name}**`,
                        });
                    }

                    setTimeout(async () => {
                        await caller.bot.deleteChannel(channel.id);
                    }, 5 * 1000);
                } catch (error) {
                    caller.logger.error(error);
                    return await ErrorMessage(command, 'Failed to delete ticket!', true);
                }
            } else {
                try {
                    await SuccessMessage(command, `Ticket will be ${isLock ? 'locked' : 'closed'} in 5 seconds.`);

                    if (middleware?.guild.logsChannel) {
                        await caller.bot.createMessage(middleware.guild.logsChannel, {
                            content: `[<t:${caller.parsing.unix()}:f>] ${isLock ? '🔒' : '📫'} ${user.mention} (\`${user.id}\`) ${isLock ? 'locked' : 'closed'} a ticket: **${channel.name}**`,
                        });
                    }

                    setTimeout(async () => {
                        await channel.edit({
                            archived: true,
                            locked: isLock ?? false,
                        });
                    }, 5 * 1000);
                } catch (error) {
                    caller.logger.error(error);
                    return await ErrorMessage(command, `Failed to ${isLock ? 'lock' : 'close'} ticket!`, true);
                }
            }
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
