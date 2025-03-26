import EventBase from '../../types/EventBase';
import { Events } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants';
import { StatusMessage } from '../../utils/message';

export default class Disconnect extends EventBase {
    name: keyof Events = 'disconnect';
    enabled = true;

    async handle(caller: Stubby) {
        if (!this.enabled) return;

        caller.logger.warning('Bot disconnected.');
        if (caller.dev) return;

        await StatusMessage(caller, {
            embeds: [
                {
                    title: `${caller.bot.user?.username} Disconnected`,
                    color: BotColors.sharkleberryFin,
                },
            ],
        });
    }
}
