import 'dotenv/config';
import { Logger, LEVEL } from '@elenoragroup/logger';

import Utils from './utils/index';
import Parsing from './utils/parsing';

import config from '../config.json';

import fs from 'fs';
import url from 'url';
import path from 'path';
import EventBase from './types/EventBase';
import { loadCommands, loadEvents } from './utils/fileHandling';
import { CommandClient, Constants } from 'athena';
import Database from './database/database';

export default class Stubby {
    config = config;
    dev = config.DEV;
    bot: CommandClient<Stubby>;
    logger = Logger.createInstance();

    database: Database;

    utils: Utils;
    parsing: Parsing;
    events = new Map<string, EventBase>();

    constructor() {
        this.logger.level = LEVEL.debug;
        this.utils = new Utils(this);
        this.bot = new CommandClient({
            token: `Bot ${this.config.TOKEN}`,
            options: { intents: [Constants.GatewayIntentBits.Guilds, Constants.GatewayIntentBits.GuildMessages] },
            commandContext: this,
            commandMiddleware: async (interaction) => {
                if (!interaction.guild) return;

                let guild = await this.database.guild.get(interaction.guild?.id);
                if (!guild) guild = await this.database.guild.create({ guildID: interaction.guild.id, guildName: interaction.guild.name });

                if (guild.guildName !== interaction.guild.name) {
                    await this.database.guild.update(interaction.guild.id, { guildName: interaction.guild.name });
                }

                return { guild };
            },
        });
        this.parsing = new Parsing(this);
        this.database = new Database(this);
    }

    async start() {
        this.logger.info('Getting ready..');
        await this.loadCommands();
        await this.loadEvents();
        await this.bot.connect();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(url.pathToFileURL(commandsPath))) return this.logger.warning(`Unable to load commands`);

        let commands = await loadCommands(commandsPath);
        commands.forEach((command) => this.bot.registerCommand(command));

        this.logger.info(`Loaded ${commands.size} commands`);
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        if (!fs.existsSync(url.pathToFileURL(eventsPath))) return this.logger.warning(`Unable to load events`);

        this.events = await loadEvents(eventsPath);
        this.events.forEach((event) => this.bot.on(event.name, (...args) => event.handle(this, ...args)));

        this.logger.info(`Loaded ${this.events.size} events`);
    }
}

new Stubby().start();
