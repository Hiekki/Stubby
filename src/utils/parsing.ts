import { Command } from 'athena';
import Stubby from '../Bot';
import moment, { Duration } from 'moment';

export default class Parsing {
    caller: Stubby;
    config: Stubby['config'];
    logger: Stubby['logger'];

    constructor(caller: Stubby) {
        this.caller = caller;
        this.config = caller.config;
        this.logger = caller.logger;
    }

    commandError(error: Error | string | unknown, command?: Command<Stubby>) {
        this.logger.error(error);
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
}
