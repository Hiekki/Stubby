import EventBase from '../../types/EventBase';
import { Events, Interaction, CommandErrorData, CommandError, Constants } from 'athena';
import Stubby from '../../Bot';
import { ErrorLogMessage } from '../../utils/message';
import { BotColors } from '../../utils/constants';

export default class CommandErrorEvent extends EventBase {
    name: keyof Events = 'commandError';
    enabled = true;

    async handle(caller: Stubby, command: string, interaction: Interaction, error: CommandErrorData) {
        if (!this.enabled) return;

        switch (error.type) {
            case CommandError.NotDeveloperGuild: //0
            case CommandError.DeniedUser: //1
            case CommandError.DeniedGuild: //2
            case CommandError.MissingPermission: //3
            case CommandError.OnCooldown: //4
            case CommandError.MiddlewareError: //5
            case CommandError.UncaughtError: {
                //6
                caller.logger.error(`Command ${command} errored with ${error.data}`);
                await ErrorLogMessage(caller, {
                    embeds: [
                        {
                            title: 'Command Error',
                            description: `Command: ${command}\n\`\`\`ts\n${error.data}\`\`\``,
                            color: BotColors.sharkleberryFin,
                            footer: {
                                text: `${caller.bot.user?.username} • Error`,
                                icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                            },
                            timestamp: new Date().toISOString(),
                        },
                    ],
                });
                break;
            }
            default: {
                caller.logger.warning(`Command ${command} errored`);
                caller.logger.error(error);
                await ErrorLogMessage(caller, {
                    embeds: [
                        {
                            title: 'Command Error',
                            description: `Command: ${command}\n\`\`\`ts\n${error}\`\`\``,
                            color: BotColors.sharkleberryFin,
                            footer: {
                                text: `${caller.bot.user?.username} • Error`,
                                icon_url: caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                            },
                            timestamp: new Date().toISOString(),
                        },
                    ],
                });
            }
        }
    }
}
