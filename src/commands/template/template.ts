import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';

export default class Template extends Command<Stubby> {
    id = 'template';
    definition = new CommandBuilder('template', 'template command').setCommandType(Constants.ApplicationCommandType.ChatInput);

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

            await command.createMessage({
                content: 'Hello!',
            });
        } catch (error) {
            caller.parsing.commandError(error, command, this.id);
        }
    }
}
