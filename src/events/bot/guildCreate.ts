import EventBase from '../../types/EventBase';
import { Events, Guild, Constants } from 'athena';
import Stubby from '../../Bot';
import { BotColors } from '../../utils/constants/index';
import moment from 'moment';
import { GuildMessage } from '../../utils/message';

export default class GuildCreate extends EventBase {
    name: keyof Events = 'guildCreate';
    enabled = true;

    async handle(caller: Stubby, guild: Guild) {
        if (!this.enabled) return;

        caller.logger.info(`Joined guild - ${guild.name} (${guild.id})`);

        await GuildMessage(caller, {
            embeds: [
                {
                    color: BotColors.green,
                    title: 'Joined Guild',
                    description: `**Name:** ${guild.name}\n**ID:** ${guild.id}\n**Created:** ${moment(guild.createdAt).format(
                        'LLLL',
                    )}\n**Age:** ${caller.parsing.accountAge(guild.createdAt)}\n\n**Count:** ${guild.memberCount}\n**Users:** ${guild.memberCount}`,
                    thumbnail: {
                        url: guild.icon
                            ? (guild.dynamicIconURL(
                                  guild.icon.indexOf('a_') !== -1 ? Constants.ImageFormat.GIF : Constants.ImageFormat.PNG,
                                  512,
                              ) ?? '')
                            : '',
                    },
                    footer: {
                        text: caller.bot.user.username,
                        icon_url: caller.bot.user.dynamicAvatarURL(Constants.ImageFormat.PNG, 512),
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    }
}
