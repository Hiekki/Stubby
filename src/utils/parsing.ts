import { CommandInteraction, ComponentInteraction, Constants, ModalSubmitInteraction } from 'athena';
import Stubby from '../Bot';
import moment, { Duration } from 'moment';
import { ErrorLogMessage, ErrorMessage, MissingPermissionsMessage } from './message';
import { AllPermissions } from '../types/Permissions';
import { BotColors } from './constants';

type Command = CommandInteraction;

export default class Parsing {
    caller: Stubby;
    bot: Stubby['bot'];
    config: Stubby['config'];
    logger: Stubby['logger'];

    constructor(caller: Stubby) {
        this.caller = caller;
        this.bot = caller.bot;
        this.config = caller.config;
        this.logger = caller.logger;
    }

    commandError(error: Error | string | unknown, command: Command, name: string) {
        this.logger.error(error);
        ErrorLogMessage(this.caller, {
            embeds: [
                {
                    title: 'Command Error',
                    description: `Command: </${name}:${command.id}>\n\n\`\`\`ts\n${error}\`\`\``,
                    color: BotColors.orange,
                    footer: {
                        text: `${this.caller.bot.user?.username} • Error`,
                        icon_url: this.caller.bot.user?.dynamicAvatarURL(Constants.ImageFormat.PNG),
                    },
                    timestamp: new Date().toISOString(),
                },
            ],
        });

        if (typeof error != 'object' && typeof error != 'string') error = 'Unknown Error';
        if (error instanceof Error) error = error.message;
        ErrorMessage(
            command,
            `There was an error running this command.\nIf this error continues, please feel free to join the support server [here](https://discord.gg/45N5FXe)!\n\n**Error:** ${error}`,
            true,
        );
    }

    parseID(content: string) {
        return content?.replace(/\D+/g, '');
    }

    snowflakeDate(resourceID: string) {
        return new Date(parseInt(resourceID, 10) / 4194304 + 1420070400000);
    }

    sanitize(content: string, mentions = true) {
        content = content
            .replace(/~/g, '\u200B~')
            .replace(/\*/g, '\u200B*')
            .replace(/_/g, '\u200B_')
            .replace(/`/g, '\u02CB')
            .replace(/\|/g, '\u200B|');
        if (mentions) content = content.replace(/@/g, '@\u200B').replace(/#/g, '#\u200B');
        return content;
    }

    unix() {
        return Math.floor(Date.now() / 1000);
    }

    parseTime(t: string) {
        let d = new Date();
        let time = t.match(/(\d+)(?::(\d\d))?\s*(p?)/);
        if (!time) return null;
        d.setHours(parseInt(time[1]) + (time[3] ? 12 : 0));
        d.setMinutes(parseInt(time[2]) || 0);
        return d;
    }

    accountAge(timestamp: Date | number) {
        const creation = moment(timestamp);
        const current = moment(new Date().toISOString());
        const duration = moment.duration(current.diff(creation));

        return this.getTimestampString(duration);
    }

    remainingTime(timestamp: Date) {
        const future = moment(timestamp);
        const current = moment(new Date().toISOString());
        const duration = moment.duration(future.diff(current));
        if (duration.milliseconds() < 0) {
            duration.add(24, 'hours');
        }

        return this.getTimestampString(duration);
    }

    timestamp(timestamp: Date | number) {
        let future = moment(timestamp);
        const current = moment(new Date().toISOString());
        const duration = moment.duration(future.diff(current));
        if (duration.milliseconds() < 0) {
            future = moment(timestamp).add(24, 'hours');
        }

        return future.toDate();
    }

    getTimestampString(duration: Duration) {
        const years = duration.years();
        const months = duration.months();
        const days = duration.days();
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        let age = '';

        if (years) age = `${years}Y `;
        if (months) age += `${months}M `;
        if (days && !years) age += `${days}D `;
        if (hours && !months) age += `${hours}h `;
        if (minutes && !days) age += `${minutes}m `;
        if (seconds && !hours) age += `${seconds}s`;

        return age.trim();
    }

    async botPermissionsCheck(command: CommandInteraction, permissions: AllPermissions[]) {
        if (command.channel.isTextBased() && command.channel.inGuild()) {
            const botPermissions = command.channel.permissionsOf(this.bot.user.id);
            const missingPermissions = botPermissions.missing(...permissions);
            if (missingPermissions.length) {
                await MissingPermissionsMessage(command, missingPermissions as AllPermissions[], true);
                return true;
            }
        } else {
            await ErrorMessage(command, 'This command can only be used in a text channel.', true);
            return true;
        }
        return false;
    }
}
