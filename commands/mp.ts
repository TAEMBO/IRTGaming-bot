
import Discord, { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import puppeteer from 'puppeteer'; // Credits to Trolly for suggesting this package
import FTPClient from 'ftp';
import fs from 'node:fs';
import { xml2js } from 'xml-js';
import config from '../config.json' assert { type: 'json' };
import { FSServers, hasRole, isMPStaff, stringifyStream, youNeedRole } from '../utilities.js';
import type { banFormat, farmFormat, TInteraction } from '../typings.js';

const fsServers = new FSServers(config.fs);
const cmdOptionChoices = fsServers.getPublicAll().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro }));

export default {
    async run(interaction: TInteraction) {
        if (!isMPStaff(interaction)) return youNeedRole(interaction, 'mpstaff');

        const FTP = new FTPClient();
        const now = Date.now();
        
        ({
            server: async () => {
                async function checkRole(role: keyof typeof interaction.client.config.mainServer.roles) {
                    if (!hasRole(interaction, role)) await youNeedRole(interaction, role);
                }

                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'start' | 'stop' | 'restart';
                const serverStatusMsg = (status: string) => interaction.client.getChan('fsLogs').send({ embeds: [new EmbedBuilder()
                    .setTitle(`${chosenServer.toUpperCase()} now ${status}`)
                    .setColor(interaction.client.config.embedColorYellow)
                    .setTimestamp()
                    .setFooter({ text: '\u200b', iconURL: interaction.user.displayAvatarURL() })
                ] });

                if (interaction.client.config.fs[chosenServer].isPrivate && !hasRole(interaction, 'mpmanager')) {
                    await checkRole('mfmanager');
                } else await checkRole('mpmanager');

                try {
                    await interaction.deferReply();
                } catch (err) {
                    return;
                }

                const serverSelector = `[name="${chosenAction}_server"]`;
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
    
                if (interaction.client.fsCache[chosenServer].status === null) return interaction.editReply('Cache not populated, retry in 30 seconds');
                if (interaction.client.fsCache[chosenServer].status === 'offline' && ['stop', 'restart'].includes(chosenAction)) return interaction.editReply('Server is already offline');
                if (interaction.client.fsCache[chosenServer].status === 'online' && chosenAction === 'start') return interaction.editReply('Server is already online');
    
                try {
                    await page.goto(interaction.client.config.fs[chosenServer].login, { timeout: 120_000 });
                } catch (err: any) {
                    return interaction.editReply(err.message);
                }
                await interaction.editReply(`Connected to dedi panel for **${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**...`);
    
                let result = 'Successfully ';
                let uptimeText: string | null | undefined;

                ({
                    start: () => {
                        result += 'started ';
                        serverStatusMsg('online');

                        interaction.client.fsCache[chosenServer].status = 'online';
                    },
                    stop: async () => {
                        result += 'stopped ';
                        serverStatusMsg('offline');

                        interaction.client.fsCache[chosenServer].status = 'offline';

                        uptimeText = await page.evaluate(() => document.querySelector("span.monitorHead")?.textContent);
                        result += `. Uptime before stopping: **${uptimeText}**`;

                    },
                    restart: async () => {
                        result += 'restarted ';
                        serverStatusMsg('restarting');

                        uptimeText = await page.evaluate(() => document.querySelector("span.monitorHead")?.textContent);
                        result += `. Uptime before restarting: **${uptimeText}**`;
                    }
                })[chosenAction]();
    
                await page.waitForSelector(serverSelector);
                await page.click(serverSelector);

                result += `**${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**`;

                if (uptimeText) result += uptimeText;

                interaction.editReply(result);
                
                setTimeout(() => browser.close(), 10_000);
            },
            mop: async () => {
                if (!hasRole(interaction, 'mpmanager')) return youNeedRole(interaction, 'mpmanager');

                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'items.xml' | 'players.xml';
                const ftpLogin = fsServers.getPublicOne(chosenServer).ftp;
                
                if (interaction.client.fsCache[chosenServer].status === 'online') return interaction.reply(`You cannot mop files from **${chosenServer.toUpperCase()}** while it is online`);
                
                await interaction.deferReply();
    
                FTP.on('ready', () => FTP.delete(ftpLogin.path + `savegame1/${chosenAction}`, async (err) => {
                    if (err) return interaction.editReply(err.message);

                    await interaction.editReply(`Successfully deleted **${chosenAction}** from **${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**`);
                    FTP.end();
                })).connect(ftpLogin);
            },
            bans: async () => {
                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'dl' | 'ul';
                const ftpLogin = fsServers.getPublicOne(chosenServer).ftp;
    
                await interaction.deferReply();
    
                if (chosenAction === 'dl') {
                    FTP.on('ready', () => FTP.get(ftpLogin.path + 'blockedUserIds.xml', (err, stream) => {
                        if (err) return interaction.editReply(err.message);

                        stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
                        stream.once('close', () => {
                            FTP.end();
                            interaction.editReply({ files: ['../databases/blockedUserIds.xml'] })
                        });
                    })).connect(ftpLogin);
                } else {
                    if (!hasRole(interaction, 'mpmanager')) return youNeedRole(interaction, 'mpmanager');
                    
                    let data: banFormat;
                    const banAttachment = interaction.options.getAttachment('bans');

                    if (!banAttachment) return interaction.editReply(`Canceled: A ban file must be supplied`);
    
                    const banData = await (await fetch(banAttachment.url)).text();

                    try {
                        data = xml2js(banData, { compact: true }) as banFormat;
                    } catch (err) {
                        return interaction.editReply(`Canceled: Improper file (not XML)`);
                    }
    
                    if (!data.blockedUserIds?.user[0]?._attributes?.displayName) return interaction.editReply('Canceled: Improper file (data format)');
    
                    FTP.on('ready', () => FTP.put(banData, ftpLogin.path + 'blockedUserIds.xml', error => {
                        if (error) {
                            interaction.editReply(error.message);
                        } else interaction.editReply(`Successfully uploaded ban file for ${chosenServer.toUpperCase()} after **${Date.now() - now}ms**`);
                        
                        FTP.end();
                    })).connect(ftpLogin);
                }
            },
            search: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true);
                const name = interaction.options.getString('name', true);
                const ftpLogin = fsServers.getPublicOne(chosenServer).ftp;

                function permIcon(perm: string, key: string) {
                    if (perm === 'true') {
                        return '✅';
                    } else if (perm === 'false') {
                        return '❌';
                    } else if (key === 'timeLastConnected') {
                        const utcDate = new Date(perm);

                        utcDate.setMinutes(utcDate.getMinutes() + fsServers.getPublicOne(chosenServer).utcDiff);
                        return utcDate.toUTCString();
                    } else return perm;
                }

                FTP.on('ready', () => FTP.get(ftpLogin.path + 'savegame1/farms.xml', async (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    const farmData = xml2js(await stringifyStream(stream), { compact: true }) as farmFormat;
                    const playerData = farmData.farms.farm[0].players.player.find(x => {
                        if (name.length === 44) {
                            return x._attributes.uniqueUserId === name;
                        } else return x._attributes.lastNickname === name;
                    });

                    if (playerData) {
                        interaction.editReply('```\n' + Object.entries(playerData._attributes).map(x => x[0].padEnd(18, ' ') + permIcon(x[1], x[0])).join('\n') + '```');
                    } else interaction.editReply('No green farm data found with that name/UUID');

                    stream.once('close', FTP.end);
                })).connect(ftpLogin);
            },
            farms: async () => {
                const chosenServer = interaction.options.getString('server', true);
                const ftpLogin = fsServers.getPublicOne(chosenServer).ftp;

                await interaction.deferReply();

                FTP.on('ready', () => FTP.get(ftpLogin.path + 'savegame1/farms.xml', (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    stream.pipe(fs.createWriteStream('../databases/farms.xml'));
                    stream.once('close', () => {
                        FTP.end();
                        interaction.editReply({ files: ['../databases/farms.xml'] });
                    });
                })).connect(ftpLogin);
            },
            password: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true);
                const ftpLogin = fsServers.getPublicOne(chosenServer).ftp;

                FTP.once('ready', () => FTP.get(ftpLogin.path + 'dedicated_server/dedicatedServerConfig.xml', async (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    const pw = (xml2js(await stringifyStream(stream), { compact: true }) as any).gameserver?.settings?.game_password?._text as string | undefined;

                    if (pw) {
                        interaction.editReply(`Current password for **${chosenServer.toUpperCase()}** is \`${pw}\``);
                    } else interaction.editReply(`**${chosenServer.toUpperCase()}** doesn't currently have a password set`);

                    stream.once('close', FTP.end);
                })).connect(ftpLogin);
            },
            roles: async () => {
                if (!hasRole(interaction, 'mpmanager')) return youNeedRole(interaction, 'mpmanager');

                const member = interaction.options.getMember("member");

                if (!member) return interaction.reply({ content: 'You need to select a member that is in this server', ephemeral: true });

                const owner = await interaction.guild.fetchOwner();
                const roleName = interaction.options.getString("role", true) as 'trustedfarmer' | 'mpfarmmanager' | 'mpjradmin' | 'mpsradmin';
                const Role = interaction.client.config.mainServer.roles[roleName];
                const roles = member.roles.cache.map((_, i) => i);
                
                if (member.roles.cache.has(Role)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`)
                            .setColor(interaction.client.config.embedColor)
                        ],
                        fetchReply: true,
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('yes')
                                .setStyle(ButtonStyle.Success)
                                .setLabel('Confirm'),
                            new ButtonBuilder()
                                .setCustomId('no')
                                .setStyle(ButtonStyle.Danger)
                                .setLabel('Cancel'))
                        ]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 30_000,
                        componentType: Discord.ComponentType.Button
                    }).on('collect', int => {
                        ({
                            yes: () => {
                                if (roleName !== 'trustedfarmer') {
                                    const slicedNick = {
                                        mpfarmmanager: 'MP Farm Manager',
                                        mpjradmin: 'MP Jr. Admin',
                                        mpsradmin: 'MP Sr. Admin'
                                    }[roleName];

                                    member.edit({
                                        roles: roles.filter(x => x !== Role && x !== interaction.client.config.mainServer.roles.mpstaff).concat(interaction.client.config.mainServer.roles.formerstaff),
                                        nick: member.nickname?.replace(slicedNick, 'Former Staff')
                                    });
                                } else member.roles.remove(Role);

                                int.update({
                                    embeds: [new EmbedBuilder()
                                        .setDescription(`<@${member.user.id}> has been removed from <@&${Role}>.`)
                                        .setColor(interaction.client.config.embedColor)
                                    ],
                                    components: []
                                });

                                owner.send(`**${interaction.user.tag}** has demoted **${member.user.tag}** from **${interaction.guild.roles.cache.get(Role)?.name}**`);
                            },
                            no: () => int.update({ embeds: [new EmbedBuilder().setDescription(`Command canceled`).setColor(interaction.client.config.embedColor)], components: [] })
                        } as any)[int.customId]();
                    });
                } else {
                    let newNickname: string | undefined;

                    ({
                        trustedfarmer: () => {
                            roles.push(Role);
                        },
                        mpfarmmanager: () => {
                            roles.push(Role, interaction.client.config.mainServer.roles.mpstaff);
                            roles.splice(roles.indexOf(interaction.client.config.mainServer.roles.trustedfarmer), 1);
                            newNickname = `${member.displayName.slice(0, 12)} | MP Farm Manager`;
                        },
                        mpjradmin: () => {
                            roles.push(Role);
                            roles.splice(roles.indexOf(interaction.client.config.mainServer.roles.mpfarmmanager), 1);
                            newNickname = member.nickname?.replace('MP Farm Manager', 'MP Jr. Admin');
                        },
                        mpsradmin: () => {
                            roles.push(Role);
                            roles.splice(roles.indexOf(interaction.client.config.mainServer.roles.mpjradmin), 1);
                            newNickname = member.nickname?.replace('MP Jr. Admin', 'MP Sr. Admin');
                        }
                    })[roleName]();
                    
                    member.edit({ roles, nick: newNickname });
                    owner.send(`**${interaction.user.tag}** has promoted **${member.user.tag}** to **${interaction.guild.roles.cache.get(Role)?.name}**`);
                    interaction.reply({ embeds: [new EmbedBuilder().setDescription(`<@${member.user.id}> has been given <@&${Role}>.`).setColor(interaction.client.config.embedColor)] });
                }
            },
            fm: () => {
                const name = interaction.options.getString('name', true);

                if (interaction.client.fmList.data.includes(name)) {
                    interaction.client.fmList.remove(name);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    interaction.client.fmList.add(name);
                    interaction.reply(`Successfully added \`${name}\``);
                }
            },
            tf: () => {
                const name = interaction.options.getString('name', true);

                if (interaction.client.tfList.data.includes(name)) {
                    interaction.client.tfList.remove(name);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    interaction.client.tfList.add(name);
                    interaction.reply(`Successfully added \`${name}\``);
                }
            }
        } as any)[interaction.options.getSubcommand()]();
	},
    data: new SlashCommandBuilder()
        .setName("mp")
        .setDescription("All things multiplayer-related")
        .addSubcommand(x=>x
            .setName('server')
            .setDescription('Turn a given server on or off')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to manage')
                .addChoices(...fsServers.entries().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro })))
                .setRequired(true))
            .addStringOption(x=>x
                .setName('action')
                .setDescription('Start or stop the given server')
                .addChoices(
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' },
                    { name: 'Restart', value: 'restart' })
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('mop')
            .setDescription('Mop a file from a given server')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to manage')
                .addChoices(...cmdOptionChoices)
                .setRequired(true))
            .addStringOption(x=>x
                .setName('action')
                .setDescription('The action to perform on the given server')
                .addChoices(
                    { name: 'Mop players.xml', value: 'players.xml' },
                    { name: 'Mop items.xml', value: 'items.xml' })
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('bans')
            .setDescription('Manage ban lists for servers')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to manage')
                .addChoices(...cmdOptionChoices)
                .setRequired(true))
            .addStringOption(x=>x
                .setName('action')
                .setDescription('To download or upload a ban file')
                .addChoices(
                    { name: 'Download', value: 'dl' },
                    { name: 'Upload', value: 'ul' })
                .setRequired(true))
            .addAttachmentOption(x=>x
                .setName('bans')
                .setDescription('The ban file if uploading')
                .setRequired(false)))
        .addSubcommand(x=>x
            .setName('search')
            .setDescription('Fetch farm data for a player')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to search on')
                .addChoices(...cmdOptionChoices)
                .setRequired(true))
            .addStringOption(x=>x
                .setName('name')
                .setDescription('The name of the player to search for')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('farms')
            .setDescription('Download farms.xml from a server')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to fetch from')
                .addChoices(...cmdOptionChoices)
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('password')
            .setDescription('Fetch the game password for a given server')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to fetch from')
                .addChoices(...cmdOptionChoices)
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('roles')
            .setDescription('Give or take MP Staff roles')
            .addUserOption(x=>x
                .setName("member")
                .setDescription("The member to add or remove the role from")
                .setRequired(true))
            .addStringOption(x=>x
                .setName("role")
                .setDescription("the role to add or remove")
                .addChoices(
                    { name: 'Trusted Farmer', value: 'trustedfarmer' },
                    { name: 'Farm Manager', value: 'mpfarmmanager' },
                    { name: 'Junior Admin', value: 'mpjradmin' },
                    { name: 'Senior Admin', value: 'mpsradmin' })
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('fm')
            .setDescription('Add or remove player names in FM list')
            .addStringOption(x=>x
                .setName('name')
                .setDescription('The player name to add or remove')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('tf')
            .setDescription('Add or remove player names in TF list')
            .addStringOption(x=>x
                .setName('name')
                .setDescription('The player name to add or remove')
                .setRequired(true)))
}
