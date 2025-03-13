import { Guild } from 'athena';
import Stubby from '../Bot';
import moment from 'moment-timezone';
import twemoji from '@twemoji/api';

export default class Utils {
    bot: Stubby['bot'];
    config: Stubby['config'];
    database: Stubby['database'];
    constructor(caller: Stubby) {
        this.bot = caller.bot;
        this.config = caller.config;
        this.database = caller.database;
    }

    getTime(timezone = 'UTC', timestamp = new Date()) {
        const dateObject = moment(timestamp).tz(timezone || 'UTC');
        return {
            dateObject,
            time: dateObject.format('HH:mm:ss'),
            date: dateObject.format('YYYY-MM-DD'),
        };
    }

    getUser(ID: string) {
        return this.bot.users.get(ID);
    }

    async getMember(guildID: string, userID: string) {
        const guild = await this.bot.guilds.get(guildID);
        return guild?.members.get(userID);
    }

    randomNumber(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    uppercaseWords(str: string) {
        return str.replace(/^(.)|\s+(.)/g, (c) => c.toUpperCase());
    }

    createPages<T>(arr: T[], size: number) {
        const pages: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            pages.push(arr.slice(i, i + size));
        }
        return pages;
    }

    async removeAllGlobalCommands() {
        let commands = await this.bot.getCommands();
        commands.forEach((command) => this.bot.deleteCommand(command.id));
        return;
    }

    async removeAllGuildCommands(guild: string) {
        let commands = await this.bot.getGuildCommands(guild);
        commands.forEach((command) => this.bot.deleteGuildCommand(guild, command.id));
        return;
    }

    parseEmoji(emoji: string): { name: string; id: string | undefined; animated: boolean } {
        if (!emoji.includes(':')) return { name: emoji, id: undefined, animated: false };
        const parsed = emoji.replace(/(<:)|(<)|(>)/g, '');
        const string = parsed.split(':');
        let animated = false;
        let name = string[0];
        let id = string[1];
        if (string[0] === 'a') {
            name = string[1];
            id = string[2];
            animated = true;
        }
        return { name, id, animated };
    }

    validateEmojis(emojis: string[]) {
        return Promise.all(emojis.map((e) => this.validateEmoji(e)));
    }

    async validateEmoji(emoji: string) {
        try {
            const parsed = this.parseEmoji(emoji);

            let url: string;
            if (parsed.id) url = `https://cdn.discordapp.com/emojis/${parsed.id}.webp?size=96`;
            else url = twemoji.parse(emoji).split('"')[7];

            const response = await fetch(url);
            return { emoji, valid: response.ok };
        } catch (error) {
            return { emoji, valid: false };
        }
    }
}
