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
                                name: 'Bot Version',
                                value: process.env.npm_package_version ?? 'N/A',
                                inline: true,
                            },
                            {
                                name: 'Guilds',
                                value: `${caller.bot.guilds.size}`,
                                inline: true,
                            },
                            {
                                name: 'DB Guilds',
                                value: `${(await caller.database.guild.all()).length}`,
                                inline: true,
                            },
                            {
                                name: 'Users',
                                //@ts-ignore --It works
                                value: `${numeral(caller.bot.guilds.reduce((a, v) => a + v.memberCount, 0)).format('0,0')}`,
                                inline: true,
                            },
                            {
                                name: 'Ticket Systems',
                                value: `${(await caller.database.tickets.all()).length}`,
                                inline: true,
                            },
                            {
                                name: 'Categories',
                                value: `${(await caller.database.categories.all()).length}`,
                                inline: true,
                            },
                            {
                                name: 'Threads',
                                value: `${(await caller.database.threads.all()).length}`,
                                inline: true,
                            },
                            {
                                name: 'Links',
                                value: 'Coming Soon:tm:', //[Documentation](N/A)\n[Support Us](N/A)\n[Support Server](N/A)\n[Invite](N/A)\n[Feature Request / Bug Report](N/A)',
                                inline: false,
                            },
                            {
                                name: 'Made By:',
                                value: 'Hiekki\nFire',
                            },
                        ],
                    },
                ],
                flags: Constants.MessageFlags.Ephemeral,
            });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }
}
