import EventBase from '../../types/EventBase';
import { Constants, Events } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants/index';
import { StatusMessage } from '../../utils/message';

export default class Ready extends EventBase {
    name: keyof Events = 'ready';
    enabled = true;

    async handle(caller: Stubby) {
        if (!this.enabled) return;

        caller.logger.info(`${caller.bot.user?.username} is ready on ${caller.bot.guilds.size} guilds.`);
        caller.bot.setActivity(Constants.ActivityType.Watching, 'your tickets.');

        if (caller.config.FORCE_DEPLOY) await caller.bot.deployCommands();
        if (caller.dev) return;

        await StatusMessage(caller, {
            embeds: [
                {
                    title: `${caller.bot.user?.username} Ready`,
                    description: `${caller.bot.guilds.size} guilds`,
                    color: BotColors.green,
                },
            ],
        });
    }
}
