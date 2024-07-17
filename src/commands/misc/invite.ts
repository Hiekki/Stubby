import { Command, CommandBuilder, CommandInteraction, ComponentBuilder, Constants } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants';

export default class Invite extends Command<Stubby> {
    id = 'invite';
    definition = new CommandBuilder('invite', 'Invite the bot').setCommandType(Constants.ApplicationCommandType.ChatInput);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            await command.createMessage({
                embeds: [
                    {
                        description: "# Stubby's Invite Links",
                        color: BotColors.purple,
                    },
                ],
                components: new ComponentBuilder()
                    .addActionRow((row) => {
                        row.addURLButton({
                            label: 'Invite Stubby',
                            url: 'https://discord.com/oauth2/authorize?client_id=1262809684667011094',
                        }).addURLButton({
                            label: 'Support Server',
                            url: 'https://discord.gg/45N5FXe',
                        });
                    })
                    .toJSON(),
                flags: Constants.MessageFlags.Ephemeral,
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
