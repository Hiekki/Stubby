import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants';

export default class Help extends Command<Stubby> {
    id = 'help';
    definition = new CommandBuilder('help', 'View all my commands here').setCommandType(Constants.ApplicationCommandType.ChatInput);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            const pages: Constants.APIEmbed[] = [
                {
                    title: 'Stubby Commands',
                    description: '__**In order to use or see these commands,\nyou must have the `ManageThreads` permission.**__',
                    color: BotColors.purple,
                    fields: [],
                    footer: {
                        text: `${caller.bot.user?.username} • Tickets`,
                        icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                    },
                    timestamp: new Date().toISOString(),
                },
            ];

            const commands = await caller.bot.getCommands();
            commands.forEach((command) => {
                if (command.name == 'help') return;
                pages[0].fields!.push({
                    name: `</${command.name}:${command.id}>`,
                    value: command.description,
                });
            });
            await command.createMessage({ embeds: pages, components: [] });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
