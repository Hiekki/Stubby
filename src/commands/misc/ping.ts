import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants/index';
import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';

export default class Ping extends Command<Stubby> {
    id = 'ping';
    definition = new CommandBuilder('ping', 'Pings the bot').setCommandType(Constants.ApplicationCommandType.ChatInput);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            let message = await command.createMessage({
                content: 'Pinging...',
            });
            if (!message) message = await command.getOriginalMessage();

            if (!message) return;
            const ping = message.createdAt - command.createdAt;
            const api = caller.bot.shards.get(0)?.latency;

            await message.edit({
                content: '',
                embeds: [
                    {
                        title: 'Ping Info',
                        description: `**Bot:** \`${ping}ms\`\n**API:** \`${api}ms\``,
                        color: BotColors.blurple,
                        footer: {
                            text: `Uptime: ${caller.parsing.accountAge(Date.now() - process.uptime() * 1000)}`,
                        },
                    },
                ],
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
