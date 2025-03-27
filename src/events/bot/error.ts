import EventBase from '../../types/EventBase';
import { Constants, Events } from 'athena';
import Stubby from '../../Bot';
import { ErrorLogMessage } from '../../utils/message';
import { BotColors } from '../../utils/constants';

export default class Error extends EventBase {
    name: keyof Events = 'error';
    enabled = true;

    async handle(caller: Stubby, error: Error) {
        if (!this.enabled) return;

        caller.logger.error(error);
        if (caller.dev) return;

        await ErrorLogMessage(caller, {
            embeds: [
                {
                    title: 'Error',
                    description: `\`\`\`ts\n${error}\`\`\``,
                    color: BotColors.orange,
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
