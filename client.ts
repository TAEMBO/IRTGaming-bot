import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import moment from 'moment';
import tokens from './tokens.json';
let importConfig: Config
try { 
    importConfig = require('./test-config.json');
    console.log('\x1b[31mUsing test-config');
} catch(err) {
    importConfig = require('./config.json');
}
import { global_formatTimeOpt, Config, FSCache, YTCache, Tokens, repeatedMessages } from './interfaces';
import { bannedWords, TFstaff, FMstaff, watchList, playerTimes, userLevels, punishments } from "./dbClasses";
export default class YClient extends Client {
    config: Config; tokens: Tokens;
    embed: typeof Discord.EmbedBuilder; collection: typeof Discord.Collection; messageCollector: typeof Discord.MessageCollector; attachmentBuilder: typeof Discord.AttachmentBuilder; 
    games: Discord.Collection<string, any>; commands: Discord.Collection<string, any>;registery: Array<Discord.ApplicationCommandDataResolvable>;
    repeatedMessages: repeatedMessages; FSCache: FSCache; YTCache: YTCache; invites: Map<any, any>;
    bannedWords: bannedWords; TFstaff: TFstaff; FMstaff: FMstaff; watchList: watchList; playerTimes: playerTimes; userLevels: userLevels; punishments: punishments
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            ws: {properties: {browser: "Discord iOS"}}
        });
        this.invites = new Map();
        this.tokens = tokens as Tokens;
        this.config = importConfig;
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentBuilder = Discord.AttachmentBuilder;
        this.games = new this.collection();
        this.commands = new this.collection();
        this.registery = [];
        this.setMaxListeners(100);
        this.repeatedMessages = {};
        this.FSCache = {
            statsGraph: -120,
            servers: {
                ps: {players: [], status: undefined, lastAdmin: undefined},
                pg: {players: [], status: undefined, lastAdmin: undefined},
            }
        };
        this.YTCache = {
            'UCQ8k8yTDLITldfWYKDs3xFg': undefined,
            'UCLIExdPYmEreJPKx_O1dtZg': undefined,
            'UCguI73--UraJpso4NizXNzA': undefined,
            'UCuNIKo9EMJZ_FdZfGnM9G1w': undefined,
            'UCKXa-FhJpPrlRigIW1O0j8g': undefined,
            'UCWYXg1sqtG9NalK5ZGt4ITA': undefined
        };
        this.bannedWords = new bannedWords(this);
        this.TFstaff = new TFstaff(this);
        this.FMstaff = new FMstaff(this);
        this.watchList = new watchList(this);
        this.playerTimes = new playerTimes(this);
        this.userLevels = new userLevels(this);
        this.punishments = new punishments(this);
    }
    async init() {
        this.login(this.tokens.token);
        this.bannedWords.initLoad();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
        this.punishments.initLoad();
        this.FMstaff.initLoad();
        this.TFstaff.initLoad();
        this.watchList.initLoad();
        this.playerTimes.initLoad().intervalSave().disableSaveNotifs();

        // Command handler
        fs.readdirSync("./commands").forEach(file => {
            const commandFile = require(`./commands/${file}`);
	        this.commands.set(commandFile.default.data.name, commandFile);
	        this.registery.push(commandFile.default.data.toJSON());
        });

        // Event handler
        fs.readdirSync('./events').forEach(file => {
    	    const eventFile = require(`./events/${file}`);
	        this.on(file.replace('.ts', ''), async (...args) => eventFile.default(this, ...args));
        });
    }
    hasModPerms = (guildMember: Discord.GuildMember) => this.config.mainServer.staffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));

    isMPStaff = (guildMember: Discord.GuildMember) => this.config.mainServer.MPStaffRoles.map(x => this.config.mainServer.roles[x]).some(x => guildMember.roles.cache.has(x));

    youNeedRole = (interaction: Discord.CommandInteraction, role: string) => interaction.reply(`You need the <@&${this.config.mainServer.roles[role]}> role to use this command`);

    timeLog = (color: string) => color + `[${moment().format('HH:mm:ss')}]`;

    formatTime(integer: number, accuracy = 1, options?: global_formatTimeOpt) {
        let achievedAccuracy = 0;
        let text: any = '';
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
                const fullTimelengths = Math.floor(integer/timeName.length);
                if (fullTimelengths == 0) continue;
                achievedAccuracy++;
                text += fullTimelengths + (options?.longNames ? (' '+timeName.name+(fullTimelengths === 1 ? '' : 's')) : timeName.name.slice(0, timeName.name === 'month' ? 2 : 1)) + (options?.commas ? ', ' : ' ');
                integer -= fullTimelengths*timeName.length;
            } else {
                break;
            }
        }
        if (text.length == 0) text = integer + (options?.longNames ? ' milliseconds' : 'ms') + (options?.commas ? ', ' : '');
        if (options?.commas){
            text = text.slice(0, -2);
            if (options?.longNames){
                text = text.split('');
                text[text.lastIndexOf(',')] = ' and';
                text = text.join('');
            }
        } return text.trim();
    }
    async YTLoop(YTChannelID: string, YTChannelName: string) {
        const xjs = require('xml-js');
        let Data: any;

        try {
            await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, { signal: AbortSignal.timeout(5000) }).then(async (response) => {
                Data = xjs.xml2js(await response.text(), {compact: true});
            });
        } catch (err) {
            console.log(this.timeLog('\x1b[31m'), `${YTChannelName} YT fail`);
            return;
        }

        if (this.YTCache[YTChannelID] == undefined) {
            this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
            return;
        }
        if (Data.feed.entry[1]['yt:videoId']._text == this.YTCache[YTChannelID]) {
            this.YTCache[YTChannelID] = Data.feed.entry[0]['yt:videoId']._text;
            (this.channels.resolve(this.config.mainServer.channels.vidsandstreams) as Discord.TextChannel).send(`**${YTChannelName}** just uploaded a new video!\n${Data.feed.entry[0].link._attributes.href}`)
        }
    }
    formatBytes(bytes: number, decimals: number, bitsOrBytes: 1000 | 1024) { // Credits to Toast for making this
        if (bytes === 0) return '0 Bytes';
        const k = bitsOrBytes;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
    }
    async punish(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">, type: string) {
        if ((!client.hasModPerms(interaction.member as Discord.GuildMember)) || (!['warn', 'mute'].includes(type) && (interaction.member as Discord.GuildMember).roles.cache.has(client.config.mainServer.roles.helper))) return client.youNeedRole(interaction, "mod");

        const time = interaction.options.getString('time') as string;
        const reason = interaction.options.getString('reason') ?? 'Unspecified';
        const GuildMember = interaction.options.getMember('member') as Discord.GuildMember;
        const User = interaction.options.getUser('member') as Discord.User;

        if (interaction.user.id == User.id) return interaction.reply(`You cannot ${type} yourself.`);
        if (!GuildMember && type != 'ban') return interaction.reply(`You cannot ${type} someone who is not in the server.`);

        await interaction.deferReply();
        await client.punishments.addPunishment(type, { time, interaction }, interaction.user.id, reason, User, GuildMember);
    }
}
