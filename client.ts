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
import { hasRole, isDCStaff, LocalDatabase, log, RepeatedMessages, youNeedRole } from './utilities.js';
import { Config, FSCache, YTCache, InviteCache, Command, Registry } from './typings.js';

export default class YClient extends Client<true> {
    public config = config as Config;
    public registry: Registry = [];
    public fsCache: FSCache = {};
    public ytCache: YTCache = {};
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
    public reminders = new reminders(this);

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
            waitQueueTimeoutMS: 50000
        }).then(() => log('Purple', 'Connected to MongoDB'));
        
        this.login(this.config.token);
        this.setMaxListeners(100);
        this.bannedWords.initLoad();
        this.FMlist.initLoad();
        this.TFlist.initLoad();
        this.whitelist.initLoad();
        this.watchListPings.initLoad();
        for (const ch of this.config.ytCacheChannels) this.ytCache[ch[0]] = null;
        for (const serverAcro of Object.keys(this.config.fs)) this.fsCache[serverAcro] = { players: [], status: null, lastAdmin: null };

        // Event handler
        for await (const file of fs.readdirSync(path.resolve('./events'))) {
            const eventFile = await import(`./events/${file}`);

            file.startsWith('ready')
                ? this.once(file.replace('.js', ''), async (...args) => eventFile.default(this, ...args))
                : this.on(file.replace('.js', ''), async (...args) => eventFile.default(this, ...args));
        }

        // Command handler
        for await (const file of fs.readdirSync(path.resolve('./commands'))) {
            const commandFile: Command["commandFile"] = await import(`./commands/${file}`);

            this.commands.set(commandFile.default.data.name, { commandFile, uses: 0 });
            this.registry.push(commandFile.default.data.toJSON());
        }
    }

    /**
     * Get a text channel via config
     * @param channel 
     */
    public getChan(channel: keyof typeof this.config.mainServer.channels) {
        return this.channels.cache.get(this.config.mainServer.channels[channel]) as Discord.TextChannel;
    }

    /**
     * @returns The main Guild that this bot is made for
     */
    public mainGuild() {
        return this.guilds.cache.get(this.config.mainServer.id) as Discord.Guild;
    }

    /**
     * @param interaction 
     * @param type The type of punishment this is
     */
    public async punish(interaction: Discord.ChatInputCommandInteraction<"cached">, type: string) {
        if ((!isDCStaff(interaction.member)) || (!['warn', 'mute'].includes(type) && hasRole(interaction, 'discordhelper'))) return youNeedRole(interaction, 'discordmoderator');
    
        const time = interaction.options.getString('time') ?? undefined;
        const reason = interaction.options.getString('reason') ?? 'Unspecified';
        const GuildMember = interaction.options.getMember('member');
        const User = interaction.options.getUser('member', true);
    
        if (interaction.user.id === User.id) return interaction.reply(`You cannot ${type} yourself.`);
        if (!GuildMember && type !== 'ban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);
    
        await interaction.deferReply();
        await this.punishments.addPunishment(type, interaction.user.id, reason, User, GuildMember, { time, interaction });
    }
}