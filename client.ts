import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import path from 'node:path';
import mongoose from "mongoose";
import userLevels from './schemas/userLevels.js';
import punishments from './schemas/punishments.js';
import playerTimes from './schemas/playerTimes.js';
import watchList from './schemas/watchList.js';
import reminders from './schemas/reminders.js';
import config from './config.json' assert { type: 'json' };
import { LocalDatabase, log, RepeatedMessages } from './utilities.js';
import { Config, FSCache, YTCache, InviteCache, Command, Registry, LogColor } from './typings.js';

export default class YClient extends Client {
    public config = config as Config;
    public embed = Discord.EmbedBuilder;
    public registry: Registry = [];
    public FSCache: FSCache = {};
    public YTCache: YTCache = {};
    public commands = new Discord.Collection<string, Command>();
    public repeatedMessages = new RepeatedMessages(this);
    public invites = new Map<string, InviteCache>();
    public bannedWords = new LocalDatabase<string>('bannedWords');
    public TFlist = new LocalDatabase<string>('TFlist');
    public FMlist = new LocalDatabase<string>('FMlist');
    public whitelist = new LocalDatabase<string>('adminWhitelist');
    public watchListPings = new LocalDatabase<string>('watchListPings');
    public userLevels = new userLevels(this);
    public punishments = new punishments(this);
    public watchList = new watchList();
    public playerTimes = new playerTimes(this);
    public reminders = new reminders();

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
        for (const ch of this.config.YTCacheChannels) this.YTCache[ch[0]] = null;
        for (const srv of this.config.FSCacheServers) this.FSCache[srv[2]] = { players: [], status: null, lastAdmin: null };

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