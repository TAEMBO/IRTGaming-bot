
import Discord, { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import puppeteer from 'puppeteer'; // Credits to Trolly for suggesting this package
import FTPClient from 'ftp';
import fs from 'node:fs';
import { xml2js } from 'xml-js';
import config from '../config.json' assert { type: 'json' };
import { FSServers, hasRole, isMPStaff, youNeedRole } from '../utilities.js';
import type { banFormat, farmFormat, TInteraction } from '../typings.js';

const fsServers = new FSServers(config.fs);
const cmdOptionChoices = fsServers.getPublicAll().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro }));

export default {
    async run(interaction: TInteraction) {
        if (!isMPStaff(interaction)) return youNeedRole(interaction, 'mpstaff');

        const name = interaction.options.getString('name');
        const FTP = new FTPClient();
        
        ({
            server: async () => {
                async function checkRole(role: keyof typeof interaction.client.config.mainServer.roles) {
                    if (!hasRole(interaction, role)) await youNeedRole(interaction, role);
                }

                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'start' | 'stop' | 'restart';

                if (interaction.client.config.fs[chosenServer].isPrivate && !hasRole(interaction, 'mpmanager')) {
                    await checkRole('mfmanager');
                } else await checkRole('mpmanager');

                try {
                    await interaction.deferReply();
                } catch (err) {
                    return;
                }

                const serverSelector = `[name="${chosenAction}_server"]`;
                const time = Date.now();
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
    
                if (interaction.client.fsCache[chosenServer].status === 'offline' && ['stop', 'restart'].includes(chosenAction)) return interaction.editReply('Server is already offline');
                if (interaction.client.fsCache[chosenServer].status === 'online' && chosenAction === 'start') return interaction.editReply('Server is already online');
    
                try {
                    await page.goto(interaction.client.config.fs[chosenServer].login, { timeout: 120_000 });
                } catch (err: any) {
                    return interaction.editReply(err.message);
                }
                await interaction.editReply(`Connected to dedi panel for **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**...`);
    
                let result = 'Dedi panel closed, result:\n';
                result += `Server: **${chosenServer.toUpperCase()}**\n`;
                result += `Action: **${chosenAction}**\n`;

                if (chosenAction !== 'start') {
                    const uptimeText = await page.evaluate(() => document.querySelector("span.monitorHead")?.textContent);
                    result += `Uptime before stopping: **${uptimeText}**\n`;
                };
    
                await page.waitForSelector(serverSelector);
                await page.click(serverSelector);
                await browser.close();

                setTimeout(() => {
                    interaction.editReply(result += `Total time taken: **${Date.now() - time}ms**`);
                    if (chosenAction === 'restart') interaction.client.getChan('fsLogs').send({ embeds: [new EmbedBuilder().setTitle(`${chosenServer.toUpperCase()} now restarting`).setColor(interaction.client.config.embedColorYellow).setTimestamp()] });
                }, 1_000);
            },
            mop: async () => {
                if (!hasRole(interaction, 'mpmanager')) return youNeedRole(interaction, 'mpmanager');

                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'items.xml' | 'players.xml';
                const time = Date.now();
                const FTPLogin = fsServers.getPublicOne(chosenServer).ftp;
                
                if (interaction.client.fsCache[chosenServer].status === 'online') return interaction.reply(`You cannot mop files from **${chosenServer.toUpperCase()}** while it is online`);
                
                await interaction.deferReply();
    
                FTP.on('ready', () => FTP.delete(FTPLogin.path + `savegame1/${chosenAction}`, async (err) => {
                    if (err) return interaction.editReply(err.message);
                    await interaction.editReply(`Successfully deleted **${chosenAction}** from **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**`);
                    FTP.end();
                })).connect(FTPLogin);
            },
            bans: async () => {
                const chosenServer = interaction.options.getString('server', true);
                const chosenAction = interaction.options.getString('action', true) as 'dl' | 'ul';
    
                await interaction.deferReply();
    
                if (chosenAction === 'dl') {
                    FTP.on('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'blockedUserIds.xml', (err, stream) => {
                        if (err) return interaction.editReply(err.message);

                        stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
                        stream.once('close', () => {
                            FTP.end();
                            interaction.editReply({ files: ['../databases/blockedUserIds.xml'] })
                        });
                    })).connect(fsServers.getPublicOne(chosenServer).ftp);
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
    
                    FTP.on('ready', () => FTP.put(banData, fsServers.getPublicOne(chosenServer).ftp.path + 'blockedUserIds.xml', error => {
                        if (error) {
                            interaction.editReply(error.message);
                        } else interaction.editReply(`Successfully uploaded ban file for ${chosenServer.toUpperCase()}`);
                        
                        FTP.end();
                    })).connect(fsServers.getPublicOne(chosenServer).ftp);
                }
            },
            search: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true);
                const name = interaction.options.getString('name', true);

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

                FTP.on('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'savegame1/farms.xml', async (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    const farmData = xml2js(await new Response(stream as any).text(), { compact: true }) as farmFormat;

                    const playerData = farmData.farms.farm[0].players.player.find(x => {
                        if (name.length === 44) {
                            return x._attributes.uniqueUserId === name;
                        } else return x._attributes.lastNickname === name;
                    });

                    if (playerData) {
                        interaction.editReply('```\n' + Object.entries(playerData._attributes).map(x => x[0].padEnd(18, ' ') + permIcon(x[1], x[0])).join('\n') + '```');
                    } else interaction.editReply('No green farm data found with that name/UUID');
                    stream.once('close', () => FTP.end());
                })).connect(fsServers.getPublicOne(chosenServer).ftp);
            },
            farms: async () => {
                const chosenServer = interaction.options.getString('server', true);

                await interaction.deferReply();

                FTP.on('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'savegame1/farms.xml', (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    stream.pipe(fs.createWriteStream('../databases/farms.xml'));
                    stream.once('close', () => {
                        FTP.end();
                        interaction.editReply({ files: ['../databases/farms.xml'] });
                    });
                })).connect(fsServers.getPublicOne(chosenServer).ftp);
            },
            password: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true);

                FTP.once('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'dedicated_server/dedicatedServerConfig.xml', async (err, stream) => {
                    if (err) return interaction.editReply(err.message);

                    const pw = (xml2js(await new Response(stream as any).text(), { compact: true }) as any).gameserver?.settings?.game_password?._text as string | undefined;

                    if (pw) {
                        interaction.editReply(`Current password for **${chosenServer.toUpperCase()}** is \`${pw}\``);
                    } else interaction.editReply(`**${chosenServer.toUpperCase()}** doesn't currently have a password set`);
                    stream.once('close', () => FTP.end());
                })).connect(fsServers.getPublicOne(chosenServer).ftp);
            },
            roles: async () => {
                if (!hasRole(interaction, 'mpmanager')) return youNeedRole(interaction, 'mpmanager');

                const member = interaction.options.getMember("member") as Discord.GuildMember;
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
                                        nick: (member.nickname as string).replace(slicedNick, 'Former Staff')
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
                            newNickname = (member.nickname as string).replace('MP Farm Manager', 'MP Jr. Admin');
                        },
                        mpsradmin: () => {
                            roles.push(Role);
                            roles.splice(roles.indexOf(interaction.client.config.mainServer.roles.mpjradmin), 1);
                            newNickname = (member.nickname as string).replace('MP Jr. Admin', 'MP Sr. Admin');
                        }
                    })[roleName]();
                    
                    member.edit({ roles, nick: newNickname });
                    owner.send(`**${interaction.user.tag}** has promoted **${member.user.tag}** to **${interaction.guild.roles.cache.get(Role)?.name}**`);
                    interaction.reply({ embeds: [new EmbedBuilder().setDescription(`<@${member.user.id}> has been given <@&${Role}>.`).setColor(interaction.client.config.embedColor)] });
                }
            },
            fm: () => {
                if (interaction.client.FMlist._content.includes(name as string)) {
                    interaction.client.FMlist.remove(name as string);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    interaction.client.FMlist.add(name as string);
                    interaction.reply(`Successfully added \`${name}\``);
                }
            },
            tf: () => {
                if (interaction.client.TFlist._content.includes(name as string)) {
                    interaction.client.TFlist.remove(name as string);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    interaction.client.TFlist.add(name as string);
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
