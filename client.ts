import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import path from 'node:path';
import mongoose from "mongoose";
import userLevels from './schemas/userLevels.js';
import punishments from './schemas/punishments.js';
import playerTimes from './schemas/playerTimes.js';
import watchList from './schemas/watchList.js';
import reminders from './schemas/reminders.js';
import localDatabase from './localDatabase.js';
import config from './config.json' assert { type: 'json' };
import { log } from './utilities.js';
import { Config, RepeatedMessages, FSCache, YTCache, InviteCache, Command, Registry, LogColor } from './typings.js';

export default class YClient extends Client {
    config = config as Config;
    embed = Discord.EmbedBuilder;
    commands = new Discord.Collection<string, Command>();
    registry: Registry = [];
    repeatedMessages: RepeatedMessages = {};
    FSCache: FSCache = {};
    YTCache: YTCache = {};
    invites = new Map<string, InviteCache>();
    bannedWords = new localDatabase<string>('bannedWords');
    TFlist = new localDatabase<string>('TFlist');
    FMlist = new localDatabase<string>('FMlist');
    whitelist = new localDatabase<string>('adminWhitelist');
    watchListPings = new localDatabase<string>('watchListPings');
    userLevels = new userLevels(this);
    punishments = new punishments(this);
    watchList = new watchList();
    playerTimes = new playerTimes(this);
    reminders = new reminders();
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            presence: config.botPresence as Discord.PresenceData
        });
        this.init();
    }
    private async init() {
        await mongoose.set('strictQuery', true).connect(this.config.mongoURL, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            keepAlive: true,
            waitQueueTimeoutMS: 50000
        }).then(() => log(LogColor.Purple, 'Connected to MongoDB'));
        
        this.login(this.config.token);
        this.setMaxListeners(100);
        this.bannedWords.initLoad();
        this.FMlist.initLoad();
        this.TFlist.initLoad();
        this.whitelist.initLoad();
        this.watchListPings.initLoad();
        this.config.YTCacheChannels.forEach(ch => this.YTCache[ch[0]] = null);
        this.config.FSCacheServers.forEach(srv => this.FSCache[srv[2]] = { players: [], status: null, lastAdmin: null });

        // Event handler
        for await (const file of fs.readdirSync(path.resolve('./events'))) {
            const eventFile = await import(`./events/${file}`);
            this.on(file.replace('.js', ''), async (...args) => eventFile.default(this, ...args));
        }

        // Command handler
        for await (const file of fs.readdirSync(path.resolve('./commands'))) {
            const commandFile: Command["commandFile"] = await import(`./commands/${file}`);
            this.commands.set(commandFile.default.data.name, { commandFile, uses: 0 });
            this.registry.push(commandFile.default.data.toJSON());
        }
    }
}