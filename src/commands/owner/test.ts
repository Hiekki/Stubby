import Stubby from '../../Bot';
import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';

export default class Test extends Command<Stubby> {
    id = 'test';
    definition = new CommandBuilder('test', 'Tests things').setCommandType(Constants.ApplicationCommandType.ChatInput);

    developerOnly = true;
    guilds = ['671824837899059210'];

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            throw new Error('Test Error');
            await command.createMessage({
                content: 'Test bro!',
            });
        } catch (error) {
            caller.parsing.commandError(error, command, this.id);
        }
    }
}
