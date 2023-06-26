import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import moment from 'moment';
import { xml2js } from "xml-js";
import mongoose from "mongoose";
import path from 'node:path';
import userLevels from './schemas/userLevels.js';
import punishments from './schemas/punishments.js';
import playerTimes from './schemas/playerTimes.js';
import watchList from './schemas/watchList.js';
import reminders from './schemas/reminders.js';
import config from './config.json' assert { type: 'json' };
import { Config, RepeatedMessages, FSCache, YTCache, InviteCache, Command, YTCacheFeed, Registry, LogColor } from './typings.js';

export default class YClient extends Client {
    config = config as Config;
    embed = Discord.EmbedBuilder;
    collection = Discord.Collection;
    commands = new this.collection<string, Command>();
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
    }
    public async init() {
        this.login(this.config.token);
        this.setMaxListeners(100);
        this.bannedWords.initLoad();
        this.FMlist.initLoad();
        this.TFlist.initLoad();
        this.whitelist.initLoad();
        this.watchListPings.initLoad();
        this.config.YTCacheChannels.forEach(ch => this.YTCache[ch[0]] = null);
        this.config.FSCacheServers.forEach(srv => this.FSCache[srv[2]] = { players: [], status: null, lastAdmin: null });

        await mongoose.set('strictQuery', true).connect(this.config.mongoURL, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            keepAlive: true,
            waitQueueTimeoutMS: 50000
        }).then(() => this.log(LogColor.Purple, 'Connected to MongoDB'));

        // Event handler
        for await (const file of fs.readdirSync('./events')) {
            const eventFile = await import(`./events/${file}`);
            this.on(file.replace('.js', ''), async (...args) => eventFile.default(this, ...args));
        }

        // Command handler
        for await (const file of fs.readdirSync('./commands')) {
            const commandFile: Command["commandFile"] = await import(`./commands/${file}`);
            this.commands.set(commandFile.default.data.name, { commandFile, uses: 0 });
            this.registry.push(commandFile.default.data.toJSON());
        }
        return this;
    }
    public log(color: LogColor, ...data: any[]) {
        console.log(`${color}[${moment().format('HH:mm:ss')}]`, ...data);
    }
    public async meetsPerms(role: keyof typeof this.config.mainServer.roles, int: Discord.ChatInputCommandInteraction<"cached">, ...conditions: boolean[]) {
        if (!conditions.every(x => x)) {
            await this.youNeedRole(int, role);
            throw new Error(`${int.user.username} Does not meet permission requirement(s)`);
        } return true;
    }
    public async youNeedRole(interaction: Discord.ChatInputCommandInteraction<"cached">, role: keyof typeof this.config.mainServer.roles) {
        return await interaction.reply(`You need the <@&${this.config.mainServer.roles[role]}> role to use this command`);
    }
    public isDCStaff(guildMember: Discord.GuildMember) {
        return this.config.mainServer.DCStaffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));
    }
    public isMPStaff(guildMember: Discord.GuildMember) {
        return this.config.mainServer.MPStaffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));
    }
    public onMFFarms(guildMember: Discord.GuildMember) {
        return this.config.mainServer.MFFarmRoles.map(x => this.config.mainServer.roles[x]).filter(x => guildMember.roles.cache.has(x));
    }
    public getChan(channel: keyof typeof this.config.mainServer.channels) {
        return this.channels.cache.get(this.config.mainServer.channels[channel]) as Discord.TextChannel;
    }
    public mainGuild() {
        return this.guilds.cache.get(this.config.mainServer.id) as Discord.Guild;
    }
    public YTLoop(YTChannelID: string, YTChannelName: string) {
        fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, { signal: AbortSignal.timeout(5000) }).then(async res => {
            const Data = xml2js(await res.text(), { compact: true }) as YTCacheFeed;
            const latestVid = Data.feed.entry[0];

            if (!this.YTCache[YTChannelID]) return this.YTCache[YTChannelID] = latestVid['yt:videoId']._text;
        
            if (Data.feed.entry[1]['yt:videoId']._text === this.YTCache[YTChannelID]) {
                this.YTCache[YTChannelID] = latestVid['yt:videoId']._text;
                this.getChan('videosAndLiveStreams').send(`**${YTChannelName}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
            }
        }).catch(() => this.log(LogColor.Red, `${YTChannelName} YT fail`));
    }
    public formatTime(integer: number, accuracy = 1, options?: { longNames: boolean, commas: boolean }) {
        let achievedAccuracy = 0;
        let text = '';
        for (const timeName of [
            { name: 'year',   length: 1000 * 60 * 60 * 24 * 365 },
            { name: 'month',  length: 1000 * 60 * 60 * 24 * 30 },
            { name: 'week',   length: 1000 * 60 * 60 * 24 * 7 },
            { name: 'day',    length: 1000 * 60 * 60 * 24 },
            { name: 'hour',   length: 1000 * 60 * 60 },
            { name: 'minute', length: 1000 * 60 },
            { name: 'second', length: 1000 }
        ]) {
            if (achievedAccuracy < accuracy) {
                const fullTimelengths = Math.floor(integer / timeName.length);
                if (fullTimelengths < 1) continue;
                achievedAccuracy++;
                text += fullTimelengths + (options?.longNames ? (' ' + timeName.name + (fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (options?.commas ? ', ' : ' ');
                integer -= fullTimelengths * timeName.length;
            } else break;
        }
        if (!text) text = integer + (options?.longNames ? ' milliseconds' : 'ms') + (options?.commas ? ', ' : '');
        if (options?.commas) {
            text = text.slice(0, -2);
            if (options?.longNames) {
                let textArr = text.split('');
                textArr[text.lastIndexOf(',')] = ' and';
                text = textArr.join('');
            }
        } return text.trim();
    }
    /** Credits to Toast for providing this */
    public formatBytes(bytes: number, decimals: number, bitsOrBytes: 1000 | 1024) {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(bitsOrBytes));
        return (bytes / Math.pow(bitsOrBytes, i)).toFixed(decimals < 0 ? 0 : decimals) + ' ' + sizes[i];
    }
    public async punish(interaction: Discord.ChatInputCommandInteraction<"cached">, type: string) {
        if ((!this.isDCStaff(interaction.member)) || (!['warn', 'mute'].includes(type) && interaction.member.roles.cache.has(this.config.mainServer.roles.discordhelper))) return this.youNeedRole(interaction, 'discordmoderator');

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

class localDatabase<T> {
    public _path: string;
    public _content: T[] = [];
    constructor(fileName: string) {
        this._path = path.resolve(`../databases/${fileName}.json`);
    }
    public initLoad() {
        this._content = JSON.parse(fs.readFileSync(this._path, 'utf8'));
    }
    public add(data: T) {
        this._content.push(data);
        fs.writeFileSync(this._path, JSON.stringify(this._content, null, 4));
    }
    public remove(data: T) {
        this._content.splice(this._content.indexOf(data), 1);
        fs.writeFileSync(this._path, JSON.stringify(this._content, null, 4));
    }
}