import { Command, CommandBuilder, CommandInteraction, Constants } from 'athena';
import Stubby from '../../Bot';
import MiddleWareType from '../../types/MiddleWare';
import { ConfirmAction, ErrorMessage, MissingPermissionsMessage, SuccessMessage } from '../../utils/message';
import { BotColors, BotEmojis } from '../../utils/constants';
import moment from 'moment';
import { AllPermissions } from '../../types/Permissions';

export default class Logs extends Command<Stubby> {
    id = 'logs';
    definition = new CommandBuilder('logs', 'Logs for all tickets')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageChannels)
        .addSubcommand('enable', 'Enable a logs channel', (sub) => {
            sub.addChannelOption('channel', 'The channel to enable the logs channel in', true, [Constants.ChannelType.GuildText]);
        })
        .addSubcommand('disable', 'Disable logs channel');

    async handleCommand(caller: Stubby, command: CommandInteraction, middleware: MiddleWareType) {
        try {
            if (!command.guild) return;

            const guild = middleware?.guild;
            if (!guild) return;

            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            const options = command.subcommand;
            switch (options) {
                case 'enable': {
                    const channel = command.getRequiredChannel('channel');

                    if (channel.isTextBased() && channel.inGuild()) {
                        const botPermissions = channel.permissionsOf(caller.bot.user.id);
                        const missingPermissions = botPermissions.missing('SendMessages', 'ViewChannel');
                        if (missingPermissions.length) {
                            return MissingPermissionsMessage(command, missingPermissions as AllPermissions[], true);
                        }
                    }

                    if (guild.logsChannel && guild.logsChannel == channel.id) {
                        return await ErrorMessage(command, 'You already have that channel enabled!', true);
                    }

                    if (guild.logsChannel) {
                        const message = await ConfirmAction(caller, command, {
                            embeds: [
                                {
                                    title: 'Logs Channel',
                                    description: `You already have a logs channel enabled: <#${guild.logsChannel}>\nAre you sure you want to overwrite it with: <#${channel.id}>?\n\n-# This command will timeout <t:${moment(Date.now()).add(1, 'minute').add(1, 'seconds').unix()}:R>`,
                                    color: BotColors.purple,
                                },
                            ],
                            flags: Constants.MessageFlags.Ephemeral,
                        });

                        if (message.timeout) {
                            return await command.editOriginalMessage({
                                embeds: [
                                    {
                                        title: `Logs Channel: Timed Out ${BotEmojis.yellowBang.full}`,
                                        description: 'You took too long to decide!',
                                        color: BotColors.yellow,
                                    },
                                ],
                                components: [],
                            });
                        }

                        const confirmed = message.result;
                        if (confirmed) {
                            await caller.database.guild.update(command.guild.id, { logsChannel: channel.id });
                            await caller.bot.createMessage(channel.id, {
                                content: `[<t:${caller.parsing.unix()}:f>] 📋 All future tickets will be logged in this channel.`,
                            });
                        }

                        await command.editOriginalMessage({
                            embeds: [
                                {
                                    title: `Logs Channel: ${confirmed ? `Success ${BotEmojis.greenTick.full}` : `Cancelled ${BotEmojis.redX.full}`}`,
                                    description: confirmed
                                        ? `Successfully enabled logs in <#${channel.id}>!`
                                        : `The request to enable logs has been cancelled.`,
                                    color: confirmed ? BotColors.green : BotColors.red,
                                },
                            ],
                            components: [],
                        });
                    } else {
                        await caller.database.guild.update(command.guild.id, { logsChannel: channel.id });
                        await caller.bot.createMessage(channel.id, {
                            content: `[<t:${caller.parsing.unix()}:f>] 📋 All future tickets will be logged in this channel.`,
                        });
                        await SuccessMessage(command, `Successfully enabled logs in <#${channel.id}>!`, true);
                    }
                    break;
                }
                case 'disable': {
                    if (!guild.logsChannel) return await ErrorMessage(command, "You don't have a logs channel enabled!", true);
                    await caller.database.guild.update(command.guild.id, { logsChannel: null });
                    await SuccessMessage(command, `Successfully disabled logs!`, true);
                    break;
                }
            }
        } catch (error) {
            caller.parsing.commandError(error, command, this.id);
        }
    }
}
