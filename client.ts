import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import moment from 'moment';
import tokens from './tokens.json';
import timeNames from './timeNames';
let importConfig: Config
try { 
    importConfig = require('./test-config.json');
    console.log('Using test-config');
} catch(err) {
    importConfig = require('./config.json');
}
import { db_punishments_format, global_formatTimeOpt, global_createTableOpt, FS_players, FS_data, FS_careerSavegame, Config, FSCache, YTCache, Tokens } from './interfaces';
import { bannedWords, TFstaff, FMstaff, watchList, playerTimes, userLevels, punishments } from "./dbClasses";
export default class YClient extends Client {
    config: Config; tokens: Tokens; moment: typeof moment; 
    embed: typeof Discord.EmbedBuilder; collection: typeof Discord.Collection; messageCollector: typeof Discord.MessageCollector; attachmentBuilder: typeof Discord.AttachmentBuilder; 
    games: Discord.Collection<string, any>; commands: Discord.Collection<string, any>;registery: Array<Discord.ApplicationCommandDataResolvable>;
    repeatedMessages: any; FSCache: FSCache; YTCache: YTCache; invites: Map<any, any>; bannedNamesPS: Array<string>; bannedNamesPG: Array<string>;
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
        this.moment = moment;
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentBuilder = Discord.AttachmentBuilder;
        this.games = new this.collection();
        this.commands = new this.collection();
        this.registery = [];
        this.setMaxListeners(100);
        this.repeatedMessages = {};
        this.bannedNamesPS = [];
        this.bannedNamesPG = [];
        this.FSCache = {
            statsGraph: -120, 
            ps: {new: [], old: [], status: undefined, lastAdmin: undefined},
            pg: {new: [], old: [], status: undefined, lastAdmin: undefined},
            mf: {new: [], old: [], status: undefined, lastAdmin: undefined}
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
        this.playerTimes.initLoad().intervalSave(15000).disableSaveNotifs();
        const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".ts"));
        for (const file of commandFiles) {
	        const command = require(`./commands/${file}`);
	        this.commands.set(command.default.data.name, command);
	        this.registery.push(command.default.data.toJSON())
           }
    }
    formatPunishmentType(punishment: db_punishments_format, client: YClient, cancels: db_punishments_format) {
        if (punishment.type === 'removeOtherPunishment') {
            cancels ||= this.punishments._content.find((x: db_punishments_format) => x.id === punishment.cancels)
            return cancels.type[0].toUpperCase() + cancels.type.slice(1) + ' Removed';
        } else return punishment.type[0].toUpperCase() + punishment.type.slice(1);
    }
    formatTime(integer: number, accuracy = 1, options?: global_formatTimeOpt) {
        let achievedAccuracy = 0;
        let text:any = '';
        for (const timeName of timeNames){
            if (achievedAccuracy < accuracy){
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
    hasModPerms(guildMember: Discord.GuildMember) {
        return this.config.mainServer.staffRoles.map((x: string) => this.config.mainServer.roles[x]).some((x: string) => guildMember.roles.cache.has(x));
    };
    isMPStaff(guildMember: Discord.GuildMember) {
        return this.config.mainServer.MPStaffRoles.map((x: string) => this.config.mainServer.roles[x]).some((x: string) => guildMember.roles.cache.has(x));
    };
    youNeedRole(interaction: Discord.CommandInteraction, role: string) {
        return interaction.reply(`You need the <@&${this.config.mainServer.roles[role]}> role to use this command`);
    }

    async FSLoop(serverURLdss: string, serverURLcsg: string, Channel: string, Message: string, serverAcro: string) {
        
        function dataPoint(slotUsage: number) {
            const DB = JSON.parse(fs.readFileSync(__dirname + `/databases/${serverAcro}PlayerData.json`, {encoding: 'utf8'}));
            DB.push(slotUsage);
            fs.writeFileSync(__dirname + `/databases/${serverAcro}PlayerData.json`, JSON.stringify(DB));
        }
        function wlEmbed(client: YClient, playerName: string, joinLog: boolean, wlReason?: string) {
            const embed = new client.embed()
                .setTitle('WATCHLIST')
                .setDescription(`\`${playerName}\` ${joinLog ? 'joined' : 'left'} **${serverAcro}** at <t:${now}:t>`)
            if (joinLog) {
                embed.setColor(client.config.embedColorGreen)
                embed.setFooter({text: `Reason: ${wlReason}`})
            } else {
                embed.setColor(client.config.embedColorRed)
            }

            return embed;
        }
        function logEmbed(client: YClient, player: FS_players, joinLog: boolean) {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
            let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
            decorators += client.FMstaff._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
            decorators += client.TFstaff._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF

            const embed = new client.embed()
                .setDescription(`\`${player.name}\`${decorators} ${joinLog ? 'joined': 'left'} **${serverAcro}** at <t:${now}:t>`)
            if (joinLog) {
                embed.setColor(client.config.embedColorGreen);
            } else {
                embed.setColor(client.config.embedColorRed)
                embed.setFooter({text: `Playtime: ${playTimeHrs}:${playTimeMins}`})
            }
            return embed;

        }
        function adminCheck(client: YClient, ArrayNew: Array<FS_players>, ArrayOld: Array<FS_players>) {
            ArrayNew.filter((x: FS_players) => {
                !ArrayOld.some((y: FS_players) => {
                    if (y.name === x.name && !y.isAdmin && x.isAdmin && !Whitelist.includes(x.name) && !client.FMstaff._content.includes(x.name)) {
                        (client.channels.resolve('830916009107652630') as Discord.TextChannel).send({embeds: [
                            new client.embed()
                                .setTitle('UNKNOWN ADMIN LOGIN')
                                .setDescription(`\`${x.name}\` on **${serverAcro}** at <t:${now}>`)
                                .setColor('#ff4d00')]})
                    }
                })
            });
        }
        function log(client: YClient, ArrayNew: Array<FS_players>, ArrayOld: Array<FS_players>) {
            // Filter for players leaving
            const missingElementsLeave = ArrayOld.filter((x: FS_players) => !ArrayNew.some((y: FS_players) => y.name === x.name)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const x of missingElementsLeave) {
                const inWl = client.watchList._content.find((y: Array<string>) => y[0] == x.name);
                if (inWl) wlChannel.send({embeds: [wlEmbed(client, inWl[0], false)]}); // Hopefully that person got banned
                
                client.playerTimes.addPlayerTime(x.name, x.uptime); // Add playerTimes data
                logChannel.send({embeds: [logEmbed(client, x, false)]})
            }
                        
            // Filter for players joining
            let playerObj;
            if (ArrayOld.length == 0 && (client.uptime as number) > 33000) {
                playerObj = ArrayNew;
            } else if (ArrayOld.length != 0) {
                playerObj = ArrayNew.filter((y: FS_players) => !ArrayOld.some((z: FS_players) => z.name === y.name));
            }

            if (playerObj != undefined) {
                playerObj.forEach((x: FS_players) => {
                    const inWl = client.watchList._content.find((y: Array<string>) => y[0] == x.name);
                    if (inWl) wlChannel.send({content: `${wlPing.map(x=>`<@${x}>`).join(" ")}`, embeds: [wlEmbed(client, inWl[0], true, inWl[1])]}); // Oh no, go get em Toast

                    logChannel.send({embeds: [logEmbed(client, x, true)]})
                })
            }
        }
        function seasons(season: string) {
            switch(season) {
                case '1':
                    return 'Yes 🔴';
                case '2':
                    return 'No';
                case '3':
                    return 'Paused 🔴';
            }
        }

        const Whitelist = JSON.parse(fs.readFileSync(__dirname + '/databases/adminWhitelist.json', {encoding: 'utf8'}));
        const wlPing = ["238248487593050113", "267270757539643402", "642735886953611265", "769710040596217897"];
        const wlChannel = this.channels.resolve(this.config.mainServer.channels.watchlist) as Discord.TextChannel;
        const logChannel = this.channels.resolve(this.config.mainServer.channels.fslogs) as Discord.TextChannel;
        const statsMsg = await (this.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message);
        const xjs = require('xml-js');
        const now = Math.round(Date.now() / 1000);
        const playerInfo: Array<string> = [];
        const statsEmbed = new this.embed();
        let justStarted = false;

        let DSSFetch: Response | void = await fetch(serverURLdss, { signal: AbortSignal.timeout(7000) }).catch((err: Error) => {
            console.log(`[${this.moment().format('HH:mm:ss')}]`, serverAcro + ' dss ' + err.message);
        }); // Fetch dedicated-server-stats.json

        let CSGFetch: Response | void = await fetch(serverURLcsg, { signal: AbortSignal.timeout(7000) }).catch((err: Error) => {
            console.log(`[${this.moment().format('HH:mm:ss')}]`, serverAcro + ' csg ' + err.message);
        }); // Fetch dedicated-server-savegame.html

        if (DSSFetch == undefined || CSGFetch == undefined || CSGFetch.status == 204) { // Blame Red
            if (CSGFetch?.status == 204) {
                statsEmbed.setImage('https://http.cat/204');
                console.log(`[${this.moment().format('HH:mm:ss')}]`, serverAcro + ' csg empty content');
            };
            statsEmbed.setTitle('Host not responding').setColor(this.config.embedColorRed);
            statsMsg.edit({embeds: [statsEmbed]});
            return;
        } 
        const FSdss = await DSSFetch.json() as FS_data;
        const FScsg = xjs.xml2js(await CSGFetch.text(), {compact: true}).careerSavegame as FS_careerSavegame;
    
        FSdss.slots.players.filter((x)=>x.isUsed).forEach((player) => {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, '0');
            const inWl = this.watchList._content.find((y: Array<string>) => y[0] == player.name);
            let decorators = player.isAdmin ? ':detective:' : ''; // Tag for if player is admin
            decorators += this.FMstaff._content.includes(player.name) ? ':farmer:' : ''; // Tag for if player is FM
            decorators += this.TFstaff._content.includes(player.name) ? ':angel:' : ''; // Tag for if player is TF
            decorators += inWl ? '⛔' : ''; // Tag for if player is on watchList

            playerInfo.push(`\`${player.name}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
        })

        // Data crunching for stats embed
        const Money = parseInt(FScsg.statistics?.money?._text).toLocaleString('en-US') ?? null;
        const IngameTimeHrs = Math.floor(FSdss.server?.dayTime / 3600 / 1000).toString().padStart(2, '0') ?? null;
        const IngameTimeMins = Math.floor((FSdss.server?.dayTime / 60 / 1000) % 60).toString().padStart(2, '0') ?? null;
        const Timescale = FScsg.settings?.timeScale?._text?.slice(0, -5) ?? null;
        const playTimeHrs = (parseInt(FScsg.statistics?.playTime?._text) / 60).toFixed(2) ?? null;
        const PlaytimeFormatted = this.formatTime((parseInt(FScsg.statistics?.playTime?._text) * 60 * 1000), 3, { commas: true, longNames: false }) ?? null;
        const Seasons = seasons(FScsg.settings?.growthMode?._text) ?? null;
        const AutosaveInterval = parseInt(FScsg.settings?.autoSaveInterval?._text).toFixed(0) ?? null;
        const SlotUsage = parseInt(FScsg.slotSystem?._attributes?.slotUsage).toLocaleString('en-US') ?? null;

        // Stats embed
        statsEmbed.setAuthor({name: `${FSdss.slots.used}/${FSdss.slots.capacity}`});
		if (FSdss.slots.used === FSdss.slots.capacity) {
			statsEmbed.setColor(this.config.embedColorRed);
		} else if (FSdss.slots.used > 9) {
			statsEmbed.setColor(this.config.embedColorYellow);
		} else statsEmbed.setColor(this.config.embedColorGreen);
        statsEmbed.setDescription(`${FSdss.slots.used === 0 ? '*No players online*' : playerInfo.join("\n")}`);
        statsEmbed.addFields({name: `**Server Statistics**`, value: [
            `**Money:** $${Money}`,
            `**In-game time:** ${IngameTimeHrs}:${IngameTimeMins}`,
            `**Timescale:** ${Timescale}x`,
            `**Playtime:** ${playTimeHrs}hrs (${PlaytimeFormatted})`,
            `**Map:** ${FSdss.server.mapName}`,
            `**Seasonal growth:** ${Seasons}`,
            `**Autosave interval:** ${AutosaveInterval} min`,
            `**Game version:** ${FSdss.server.version}`,
            `**Slot usage:** ${SlotUsage}`
        ].join('\n')});
        statsMsg.edit({embeds: [statsEmbed]});
        
        // Logs
        if (FSdss.server.name.length === 0) {
            if (this.FSCache[serverAcro.toLowerCase()].status === 1) {
                logChannel.send({embeds: [new this.embed().setTitle(`${serverAcro} now offline`).setColor(this.config.embedColorYellow).setTimestamp()]});
            }
            this.FSCache[serverAcro.toLowerCase()].status = 0;
        } else {
            if (this.FSCache[serverAcro.toLowerCase()].status === 0) {
                logChannel.send({embeds: [new this.embed().setTitle(`${serverAcro} now online`).setColor(this.config.embedColorYellow).setTimestamp()]});
		        justStarted = true;
            }
            this.FSCache[serverAcro.toLowerCase()].status = 1;
        }

        if (!justStarted) {
            this.FSCache[serverAcro.toLowerCase()].new = FSdss.slots.players.filter((x) =>x.isUsed);

            if (serverAcro != 'MF') adminCheck(this, this.FSCache[serverAcro.toLowerCase()].new, this.FSCache[serverAcro.toLowerCase()].old);
            log(this, this.FSCache[serverAcro.toLowerCase()].new, this.FSCache[serverAcro.toLowerCase()].old);
            dataPoint(FSdss.slots.used);
            if (FSdss.slots.players.filter((x)=> x.isAdmin).length != 0) this.FSCache[serverAcro.toLowerCase()].lastAdmin = Date.now();

            this.FSCache[serverAcro.toLowerCase()].old = FSdss.slots.players.filter((x) =>x.isUsed);
        }
    };
    async YTLoop(YTChannelID: string, YTChannelName: string) {
        const xjs = require('xml-js');
        let Data: any;

        try {
            await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, { signal: AbortSignal.timeout(5000) }).then(async (response) => {
                Data = xjs.xml2js(await response.text(), {compact: true});
            });
        } catch (err) {
            console.log(`[${this.moment().format('HH:mm:ss')}]`, `${YTChannelName} YT fail`);
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
    alignText(text: string, length: number, alignment: string, emptyChar = ' ') {
        if (alignment === 'right') {
            text = emptyChar.repeat(length - text.length) + text;
        } else if (alignment === 'middle') {
            const emptyCharsPerSide = (length - text.length) / 2;
            text = emptyChar.repeat(Math.floor(emptyCharsPerSide)) + text + emptyChar.repeat(Math.floor(emptyCharsPerSide));
        } else {
            text = text + emptyChar.repeat(length - text.length);
        }
        return text;
    }
    formatBytes(bytes: number, decimals: number, bitsOrBytes: 1000 | 1024) { // Credits to Toast for making this
        if (bytes === 0) return '0 Bytes';
        const k = bitsOrBytes;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
    }
    createTable(columnTitles: string[], rowsData: any, options: global_createTableOpt, client: YClient) {
        const rows: any = [];
        let { columnAlign = [], columnSeparator = [], columnEmptyChar = [] } = options;
        if (columnSeparator.length < 1) columnSeparator.push('|');
        columnSeparator = columnSeparator.map((x: string) => ` ${x} `);
        // column widths
        const columnWidths = columnTitles.map((title: any, i) => Math.max(title.length, ...rowsData.map((x: any)=> x[i].length)));
        // first row
        rows.push(columnTitles.map((title, i) => {
            let text = client.alignText(title, columnWidths[i], columnAlign[i], columnEmptyChar[i]);
            if (columnSeparator[i]) {
                text += ' '.repeat(columnSeparator[i].length);
            }
            return text;
        }).join(''));
        // big line
        rows.push('━'.repeat(rows[0].length));
        // data
        // remove unicode
        rowsData.map((row: any) => {
            return row.map((element: string) => {
                return element.split('').map((char: string) => {
                    if (char.charCodeAt(0) > 128) return '□';
                }).join('');
            });
        });
        rows.push(rowsData.map((row: any) => row.map((element: string, i: number) => {
                return client.alignText(element, columnWidths[i], columnAlign[i], columnEmptyChar[i]) + (i === columnTitles.length - 1 ? '' : columnSeparator[i]);
            }).join('')
        ).join('\n'))
    
        return rows.join('\n');
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
    async unPunish(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.hasModPerms(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, "mod");
        
        const punishment = client.punishments._content.find((x: db_punishments_format) => x.id === interaction.options.getInteger("case_id"));
        if (!punishment) return interaction.reply({content: "that isn't a valid case ID.", ephemeral: true});
        if (punishment.type !== ('warn' || 'mute') && (interaction.member as Discord.GuildMember).roles.cache.has(client.config.mainServer.roles.helper)) return client.youNeedRole(interaction, "mod");
        const reason = interaction.options.getString("reason") ?? 'Unspecified';
        
        await client.punishments.removePunishment(punishment.id, interaction.user.id, reason, interaction);
    };
}