import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import { BotColors, BotEmojis } from '../../utils/constants';
import { ConfirmAction, ErrorMessage, SuccessMessage } from '../../utils/message';
import moment from 'moment';

export default class Developer extends Command<Stubby> {
    id = 'dev';
    definition = new CommandBuilder('dev', 'Dev Commands')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .addSubcommand('reload', 'Reloads a command', (sub) => {
            sub.addStringOption({ name: 'area', description: 'Reloads specific area', choices: ['Commands', 'Events'] });
        })
        .addSubcommand('deploy', 'Deploys commands')
        .addSubcommand('nuke', 'Nukes guild commands from all guilds')
        .addSubcommand('eval', 'Evaluates code', (sub) => {
            sub.addStringOption({ name: 'code', description: 'Code to evaluate', required: true });
        })
        .addSubcommand('leave', 'Leaves a guild', (sub) => {
            sub.addStringOption({ name: 'id', description: 'Guild to leave', required: true });
        });

    developerOnly = true;
    guilds = ['671824837899059210'];

    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            if (!caller.config.ADMINS.includes(user.id)) {
                return ErrorMessage(command, 'You do not have permission to use this command.', true);
            }

            switch (command.subcommand) {
                case 'reload': {
                    try {
                        switch (command.getString('area')) {
                            case 'commands': {
                                await caller.loadCommands();
                                break;
                            }
                            case 'events': {
                                await caller.loadEvents();
                                break;
                            }
                            default: {
                                await caller.loadCommands();
                                await caller.loadEvents();
                                break;
                            }
                        }
                        await SuccessMessage(command, `${command.getString('area') ?? 'commands and events'} reloaded!`, true);
                    } catch (error) {
                        caller.logger.error(error);
                        await ErrorMessage(command, 'Failed to reload!', true);
                    }
                    break;
                }
                case 'deploy': {
                    try {
                        await caller.bot.deployCommands();
                        await SuccessMessage(command, 'Commands deployed!', true);
                    } catch (error) {
                        caller.logger.error(error);
                        await ErrorMessage(command, 'Failed to deploy commands!', true);
                    }
                    break;
                }
                case 'nuke': {
                    const confirmation = await ConfirmAction(
                        caller,
                        command,
                        {
                            embeds: [
                                {
                                    title: 'Nuke Guild Commands',
                                    description: `This will remove all guild commands from all guilds.\nAre you sure you want to continue?\n\n-# This command will timeout <t:${moment(Date.now()).add(1, 'minute').add(1, 'seconds').unix()}:R>`,
                                    color: BotColors.purple,
                                },
                            ],
                            flags: Constants.MessageFlags.Ephemeral,
                        },
                        60,
                        false,
                        'Thanos snap, right now.',
                        'No snapping, today',
                    );

                    if (confirmation.timeout) {
                        await command.editOriginalMessage({
                            embeds: [
                                {
                                    title: `Nuke Guild Commands: Timed Out`,
                                    description: 'You took too long to decide, so I backed out.',
                                    color: BotColors.yellow,
                                },
                            ],
                            components: [],
                        });
                    }

                    const confirmed = confirmation.result;

                    if (confirmed) {
                        caller.bot.guilds.forEach(async (guild) => {
                            await guild.bulkEditCommands([]);
                        });
                    }

                    await command.editOriginalMessage({
                        embeds: [
                            {
                                title: `Nuked Guild Commands: ${confirmed ? `Success ${BotEmojis.greenTick.full}` : `Cancelled ${BotEmojis.redX.full}`}`,
                                description: confirmed
                                    ? 'All guild commands have been Thanos snapped!'
                                    : 'The request to Thanos snap all guild commands has been cancelled.',
                                color: confirmed ? BotColors.green : BotColors.red,
                            },
                        ],
                    });
                    break;
                }
                case 'eval': {
                    const code = command.getString('code');
                    if (typeof code !== 'string') return;
                    try {
                        let evaled = code.indexOf('await') !== -1 ? await eval(`(async () => {${code}})();`) : eval(code);
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        if (evaled.length > 1960) {
                            await command.createMessage({
                                content: '```Result longer then 2000 characters so it was logged to console.```',
                                flags: Constants.MessageFlags.Ephemeral,
                            });
                            console.log(evaled);
                        } else if (evaled === undefined)
                            await command.createMessage({
                                content: `\`\`\`json\n${evaled}\n\`\`\``,
                                flags: Constants.MessageFlags.Ephemeral,
                            });
                        else
                            await command.createMessage({
                                content: `\`\`\`json\n${evaled}\n\`\`\``,
                                flags: Constants.MessageFlags.Ephemeral,
                            });
                    } catch (e) {
                        await command.createMessage({ content: `\`\`\`json\n${e}\n\`\`\``, flags: Constants.MessageFlags.Ephemeral });
                    }
                    break;
                }
                case 'leave': {
                    const id = command.getRequiredString('id');

                    let guild = caller.bot.guilds.get(id);
                    if (!guild) return await ErrorMessage(command, `Could not find guild with id: ${id}`, true);
                    else {
                        try {
                            await guild.leave();
                            await SuccessMessage(command, `Left guild: ${guild.name} (${guild.id})`, true);
                        } catch (error) {
                            caller.logger.error(error);
                            await ErrorMessage(command, 'Failed to leave guild!', true);
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            caller.parsing.commandError(error, command, this.id);
        }
    }
}
