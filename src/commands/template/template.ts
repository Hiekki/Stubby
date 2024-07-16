import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';

export default class Template extends Command<Stubby> {
    id = 'template';
    definition = new CommandBuilder('template', 'template command').setCommandType(Constants.ApplicationCommandType.ChatInput);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            await command.createMessage({
                content: 'Hello!',
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
