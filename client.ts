import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import fs from "node:fs";
import timeNames from './timeNames';
import { db_punishments_format, global_formatTimeOpt, global_createTableOpt, FSdss_serverName, FS_players, tokens } from './interfaces';
import { bannedWords, TFstaff, FMstaff, watchList, playerTimes, userLevels, tictactoe, punishments } from "./dbClasses";
export default class YClient extends Client {
    invites: Map<any, any>; config: any; tokens: tokens; axios: any; moment: any; embed: typeof Discord.EmbedBuilder; collection: any; messageCollector: any; attachmentBuilder: any; games: any; commands: Discord.Collection<string, any>;registery: Array<Discord.ApplicationCommandDataResolvable>;
	repeatedMessages: any;
	FSCache: any;
	YTCache: any;
	bannedWords: bannedWords;
    TFstaff: TFstaff;
    FMstaff: FMstaff;
    watchList: watchList;
    playerTimes: playerTimes;
    userLevels: userLevels;
    tictactoe: tictactoe;
	punishments: punishments
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            ws: {properties: {browser: "Discord iOS"}}
        })
        this.invites = new Map();
        this.config = require("./config.json");
        this.tokens = require("./tokens.json");
        this.axios = require("axios");
        this.moment = require('moment');
        this.embed = Discord.EmbedBuilder;
        this.collection = Discord.Collection;
        this.messageCollector = Discord.MessageCollector;
        this.attachmentBuilder = Discord.AttachmentBuilder;
        this.games = new Discord.Collection();
        this.commands = new Discord.Collection();
        this.registery = [];
        this.setMaxListeners(100)
        this.repeatedMessages = {};
        this.FSCache = {
            statsGraph: -120, 
            ps: {new: [], old: [], status: undefined},
            pg: {new: [], old: [], status: undefined},
            mf: {new: [], old: [], status: undefined}
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
        this.tictactoe = new tictactoe(this);
        this.punishments = new punishments(this);
    }
    async init(){
        this.login(this.tokens.token);
        this.bannedWords.initLoad();
        this.tictactoe.initLoad().intervalSave().disableSaveNotifs();
        this.userLevels.initLoad().intervalSave(15000).disableSaveNotifs();
        this.punishments.initLoad();
        this.FMstaff.initLoad();
        this.TFstaff.initLoad();
        this.watchList.initLoad();
        this.playerTimes.initLoad().disableSaveNotifs();
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
            const DB = require(`./databases/${serverAcro}PlayerData.json`);
            DB.push(slotUsage);
            fs.writeFileSync(__dirname + `/databases/${serverAcro}PlayerData.json`, JSON.stringify(DB));
        }
        function adminCheck(client: YClient, ArrayNew: Array<FS_players>, ArrayOld: Array<FS_players>, Whitelist: Array<string>) {
            ArrayNew.filter((x: FS_players) => {
                !ArrayOld.some((y: FS_players) => {
                    if (y.name === x.name && !y.isAdmin && x.isAdmin && !Whitelist.includes(x.name) && !client.FMstaff._content.includes(x.name)) {
                        (client.channels.resolve('830916009107652630') as Discord.TextChannel).send({embeds: [new client.embed().setTitle('UNKNOWN ADMIN LOGIN').setDescription(`\`${x.name}\` on **${serverAcro}** at <t:${Math.round(Date.now() / 1000)}>`).setColor('#ff4d00')]})
                    }
                })
            });
        }
        function log(client: YClient, ArrayNew: Array<FS_players>, ArrayOld: Array<FS_players>, watchList = true) {
            // Filter for players leaving
            const missingElementsLeave = ArrayOld.filter((x: FS_players) => !ArrayNew.some((y: FS_players) => y.name === x.name)); // Filter names that were in the first fetch but not the second. Thanks to LebSter#0617 for this on The Coding Den Discord server
            for (const x of missingElementsLeave) {
                client.playerTimes.addPlayerTime(x.name, x.uptime).forceSave();
                client.watchList._content.forEach((y: Array<string>) => {
                    if (y[0] === x.name && watchList) {
                        wlChannel.send({embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${y[0]}\` left **${serverAcro}** at <t:${Math.round(Date.now() / 1000)}:t>`).setColor(client.config.embedColorRed)]})
                    } // Hopefully that person got banned
                })
                logChannel.send({embeds: [new client.embed().setDescription(`\`${x.name}\` ${(!x.isAdmin ? '' : ':detective:')}${(client.FMstaff._content.includes(x.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(x.name) ? ':angel:' : '')} left **${serverAcro}** at <t:${Math.round(Date.now() / 1000)}:t>`).setFooter({text: `Playtime: ${(Math.floor(x.uptime/60))}:${('0' + (x.uptime % 60)).slice(-2)}`}).setColor(client.config.embedColorRed)]})
            }
                        
            // Filter for players joining
            let playerObj;
            if (ArrayOld.length == 0 && (client.uptime as number) > 33000) {
                playerObj = ArrayNew;
            } else if (ArrayOld.length != 0) {
                playerObj = ArrayNew.filter((y: any) => !ArrayOld.some((z: any) => z.name === y.name));
            }

            if (playerObj != undefined) {
                playerObj.forEach((x: FS_players) => {
                    client.watchList._content.forEach((y: Array<string>) => {
                        if (y[0] === x.name && watchList) {
                            wlChannel.send({content: `${wlPing.map(x=>`<@${x}>`).join(" ")}`, embeds: [new client.embed().setTitle('WATCHLIST').setDescription(`\`${y[0]}\` joined **${serverAcro}** at <t:${Math.round(Date.now() / 1000)}:t>`).setFooter({text: `Reason: ${y[1]}`}).setColor(client.config.embedColorGreen)]})
                        } // Oh no, go get em Toast
                    })
                    logChannel.send({embeds: [new client.embed().setDescription(`\`${x.name}\` ${(client.FMstaff._content.includes(x.name) ? ':farmer:' : '')}${(client.TFstaff._content.includes(x.name) ? ':angel:' : '')} joined **${serverAcro}** at <t:${Math.round(Date.now() / 1000)}:t>`).setColor(client.config.embedColorGreen)]})
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
        function getData(client: YClient, URL: string) {
            return client.axios.get(URL, {timeout: 5000}).catch((error: Error) => {return error});
        }

        const Whitelist = require('./databases/adminWhitelist.json');
        const wlPing = ["238248487593050113", "267270757539643402", "642735886953611265"];
        const wlChannel = this.channels.resolve(this.config.mainServer.channels.watchlist) as Discord.TextChannel;
        const logChannel = this.channels.resolve(this.config.mainServer.channels.fslogs) as Discord.TextChannel;
        const xjs = require('xml-js');
        const playerInfo: Array<string> = [];
        const embed = new this.embed();
        let justStarted = false;
        let error;
        let FSdss: any;
        let FScsg: any;

        await Promise.all([getData(this, serverURLdss), getData(this, serverURLcsg)]).then(function (results) {
            if (results[0].status == 200) {
                FSdss = results[0] as FSdss_serverName;
            } else { FSdss = `${serverAcro} dss fail with status ${results[0].status}`};

            if (results[1].status == 200) {
                FScsg = xjs.xml2js(results[1].data, {compact: true, spaces: 2}).careerSavegame;
            } else { FScsg = `${serverAcro} csg fail with status ${results[1].status}`};
        }).catch((error) => console.log(error))

        if (typeof FSdss == 'string') {
            error = true;
            console.log(`[${this.moment().format('HH:mm:ss')}]`, FSdss);
        }

        if (typeof FScsg == 'string') {
            error = true;
            console.log(`[${this.moment().format('HH:mm:ss')}]`, FScsg);
        }

        if (error) { // Blame Red
            embed.setTitle('Host not responding');
            embed.setColor(this.config.embedColorRed);
            (this.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message).then((msg: Discord.Message)=>{ msg.edit({embeds: [embed]})});
            return;
        }
    
        FSdss.data.slots.players.filter((x: FS_players)=>x.isUsed).forEach((player: FS_players) => {
            let wlPlayer = ''; // Tag for if player is on watchList
            this.watchList._content.forEach((x: Array<string>) => {
                if (x[0] == player.name) {
                    wlPlayer = '⛔';
                }
            })
            playerInfo.push(`\`${player.name}\` ${wlPlayer}${(player.isAdmin ? ' :detective:' : '')}${(this.FMstaff._content.includes(player.name) ? ':farmer:' : '')}${(this.TFstaff._content.includes(player.name) ? ':angel:' : '')} **|** ${(Math.floor(player.uptime/60))}:${('0' + (player.uptime % 60)).slice(-2)}`);
        })

        // Stats embed
        embed.setAuthor({name: `${FSdss.data.slots.used}/${FSdss.data.slots.capacity}`})
		if (FSdss.data.slots.used === FSdss.data.slots.capacity) {
			embed.setColor(this.config.embedColorRed)
		} else if (FSdss.data.slots.used > 9) {
			embed.setColor(this.config.embedColorYellow)
		} else embed.setColor(this.config.embedColorGreen)
        embed.setDescription(`${FSdss?.data.slots.used === 0 ? '*No players online*' : playerInfo.join("\n")}`);
        embed.addFields({name: `**Server Statistics**`, value: [
                `**Money:** $${parseInt(FScsg?.statistics?.money._text).toLocaleString('en-US')}`,
                `**In-game time:** ${('0' + Math.floor((FSdss.data.server.dayTime/3600/1000))).slice(-2)}:${('0' + Math.floor((FSdss.data.server.dayTime/60/1000)%60)).slice(-2) ?? null}`,
                `**Timescale:** ${(FScsg.settings?.timeScale?._text?.slice(0, -5))?.toLocaleString('en-US') ?? null}x`,
                `**Playtime:** ${this.formatTime((parseInt(FScsg.statistics.playTime._text) * 60 * 1000), 3, { commas: true, longNames: true })}`,
                `**Map:** ${FSdss.data.server.mapName ?? null}`,
                `**Seasonal growth:** ${seasons(FScsg.settings.growthMode._text)}`,
                `**Autosave interval:** ${Math.round(parseInt(FScsg.settings.autoSaveInterval._text))} min`,
                `**Game version:** ${FSdss.data.server.version ?? null}`,
                `**Slot usage:** ${parseInt(FScsg?.slotSystem._attributes.slotUsage).toLocaleString('en-US')}`
                ].join('\n')
            });
        (this.channels.resolve(Channel) as Discord.TextChannel).messages.fetch(Message).then((msg: Discord.Message)=>{ msg.edit({embeds: [embed]})})

        // Logs
        if (FSdss.data.server.name.length === 0) {
            if (this.FSCache[serverAcro.toLowerCase()].status === 1) {
                logChannel.send({embeds: [new this.embed().setTitle(`${serverAcro} now offline`).setColor(this.config.embedColorYellow)]})
            }
            this.FSCache[serverAcro.toLowerCase()].status = 0;
        } else {
            if (this.FSCache[serverAcro.toLowerCase()].status === 0) {
                logChannel.send({embeds: [new this.embed().setTitle(`${serverAcro} now online`).setColor(this.config.embedColorYellow)]})
		        justStarted = true;
            }
            this.FSCache[serverAcro.toLowerCase()].status = 1;
        }

        if (!justStarted) {
            this.FSCache[serverAcro.toLowerCase()].new = FSdss.data.slots.players.filter((x: FS_players) =>x.isUsed);

            if (serverAcro != 'MF') {adminCheck(this, this.FSCache[serverAcro.toLowerCase()].new, this.FSCache[serverAcro.toLowerCase()].old, Whitelist)};
            log(this, this.FSCache[serverAcro.toLowerCase()].new, this.FSCache[serverAcro.toLowerCase()].old);
            dataPoint(FSdss.data.slots.used);

            this.FSCache[serverAcro.toLowerCase()].old = FSdss.data.slots.players.filter((x: FS_players) =>x.isUsed);
        }
    };
    async YTLoop(YTChannelID: string, YTChannelName: string) {
        const xjs = require('xml-js');
        let Data: any;
        let error;

        try {
            await this.axios.get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {timeout: 5000}).then((xml: any) => {
                Data = xjs.xml2js(xml.data, {compact: true, spaces: 2});
            })
        } catch (err) {
            error = true;
            console.log(`[${this.moment().format('HH:mm:ss')}]`, `${YTChannelName} YT fail`);
        }

        if (error) return;
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
    createTable(columnTitles: string[], rowsData: any, options: global_createTableOpt, client: YClient) {
        const rows: any = [];
        // { columnAlign: [], columnSeparator: [], columnEmptyChar: [] }
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