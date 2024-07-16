import Stubby from '../../Bot';
import { BotColors, BotEmojis } from '../../utils/constants/index';
import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import { ConfirmAction, Pagination } from '../../utils/message';

export default class Test extends Command<Stubby> {
    id = 'test';
    definition = new CommandBuilder('test', 'Tests things').setCommandType(Constants.ApplicationCommandType.ChatInput);

    developerOnly = true;
    guilds = ['671824837899059210'];

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            await command.createMessage({
                content: 'Test bro!',
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}