import { Command, CommandBuilder, CommandInteraction, Constants, VERSION } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants';
import { version } from 'process';
import numeral from 'numeral';

export default class Info extends Command<Stubby> {
    id = 'info';
    definition = new CommandBuilder('info', 'Info about Stubby').setCommandType(Constants.ApplicationCommandType.ChatInput);

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            await command.createMessage({
                embeds: [
                    {
                        title: 'Stubby Information',
                        color: BotColors.purple,
                        fields: [
                            {
                                name: 'Library',
                                value: `Athena v${VERSION}`,
                                inline: true,
                            },
                            {
                                name: 'Node.JS',
                                value: version,
                                inline: true,
                            },
                            {
                                name: 'Bot',
                                value: process.env.npm_package_version ? `v${process.env.npm_package_version}` : 'N/A',
                                inline: true,
                            },
                            {
                                name: 'Guilds',
                                value: numeral(caller.bot.guilds.size).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'DB Guilds',
                                value: numeral((await caller.database.guild.all()).length).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'Users',
                                //@ts-ignore --It works
                                value: numeral(caller.bot.guilds.reduce((a, v) => a + v.memberCount, 0)).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'Systems',
                                value: numeral((await caller.database.tickets.all()).length).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'Categories',
                                value: numeral((await caller.database.categories.all()).length).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'Tickets',
                                value: numeral((await caller.database.threads.all()).length).format('0,0'),
                                inline: true,
                            },
                            {
                                name: 'Links',
                                value: '[Support Server](https://discord.gg/elenora)\n[Bot Invite](https://discord.com/oauth2/authorize?client_id=1262809684667011094)\n[Terms of Service](https://www.elenora.gg/tos)\n[Privacy Policy](https://www.elenora.gg/privacy)',
                                inline: false,
                            },
                            {
                                name: 'Made By:',
                                value: 'Hiekki, Fire',
                            },
                        ],
                        footer: {
                            text: `Uptime: ${caller.parsing.accountAge(Date.now() - process.uptime() * 1000)}`,
                        },
                    },
                ],
                flags: Constants.MessageFlags.Ephemeral,
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
