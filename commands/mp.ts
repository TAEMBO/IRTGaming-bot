
import Discord, { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client.js';
import puppeteer from 'puppeteer'; // Credits to Trolly for suggesting this package
import FTPClient from 'ftp';
import fs from 'node:fs';
import { xml2js } from 'xml-js';
import type { banFormat, farmFormat } from '../typings.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, 'mpstaff');
        const name = interaction.options.getString('name');
        const FTP = new FTPClient();
        ({
            server: async () => {
                async function checkRole(role: keyof typeof client.config.mainServer.roles) {
                    if (!interaction.member.roles.cache.has(client.config.mainServer.roles[role])) await client.youNeedRole(interaction, role);
                }

                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg' | 'mf';
                const chosenAction = interaction.options.getString('action', true) as 'start' | 'stop';

                if (chosenServer === 'mf' && !interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) {
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
    
                if (client.FSCache[chosenServer].status === 'offline' && chosenAction === 'stop') return interaction.editReply('Server is already offline');
                if (client.FSCache[chosenServer].status === 'online' && chosenAction === 'start') return interaction.editReply('Server is already online');
    
                try {
                    await page.goto(client.config.fs[chosenServer].login, { timeout: 120000 });
                } catch (err: any) {
                    return interaction.editReply(err.message);
                }
                await interaction.editReply(`Connected to dedi panel for **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**...`);
    
                let result = 'Dedi panel closed, result:\n';
                result += `Server: **${chosenServer.toUpperCase()}**\n`;
                result += `Action: **${chosenAction}**\n`;
                if (chosenAction === 'stop') {
                    const uptimeText = await page.evaluate(() => document.querySelector("span.monitorHead")?.textContent);
                    result += `Uptime before stopping: **${uptimeText}**\n`;
                };
    
                await page.waitForSelector(serverSelector);
                await page.click(serverSelector);
                setTimeout(async () => {
                    await browser.close();
                    interaction.editReply(result += `Total time taken: **${Date.now() - time}ms**`);
                }, 2000);
            },
            mop: async () => {
                if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, 'mpmanager');
                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
                const chosenAction = interaction.options.getString('action', true) as 'items.xml' | 'players.xml';
                
                if (client.FSCache[chosenServer].status === 'online') return interaction.reply(`You cannot mop files from **${chosenServer.toUpperCase()}** while it is online`);
                if (chosenServer !== 'pg' && chosenAction === 'items.xml') return interaction.reply(`You can only mop **${chosenAction}** from **PG**`);
                
                const time = Date.now();
                await interaction.deferReply();
                const FTPLogin = client.config.ftp[chosenServer];
    
                FTP.on('ready', () => FTP.delete(FTPLogin.path + `savegame1/${chosenAction}`, async (err) => {
                    if (err) return interaction.editReply(err.message);
                    await interaction.editReply(`Successfully deleted **${chosenAction}** from **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**`);
                    FTP.end();
                })).connect(FTPLogin);
            },
            bans: async () => {
                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
                const chosenAction = interaction.options.getString('action', true) as 'dl' | 'ul';
    
                await interaction.deferReply();
    
                if (chosenAction === 'dl') {
                    if (chosenServer === 'pg') {
                        FTP.on('ready', () => FTP.get(client.config.ftp.pg.path + 'blockedUserIds.xml', (err, stream) => {
                            if (err) return interaction.editReply(err.message);

                            stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
                            stream.once('close', () => {
                                FTP.end();
                                interaction.editReply({ files: ['../databases/blockedUserIds.xml'] })
                            });
                        })).connect(client.config.ftp.pg);
                    } else interaction.editReply({ files: ['../../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml'] });
                } else {
                    if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, "mpmanager");
                    
                    let data: banFormat;
                    const banAttachment = interaction.options.getAttachment('bans');
                    if (!banAttachment) return interaction.editReply(`Canceled: A ban file must be supplied`);
    
                    const banData = await (await fetch(banAttachment.url)).text();
                    try {
                        data = xml2js(banData, { compact: true }) as banFormat;
                    } catch (err) {
                        return interaction.editReply(`Canceled: Improper file (not XML)`);
                    }
    
                    if (!data.blockedUserIds?.user[0]?._attributes?.displayName) return interaction.editReply(`Canceled: Improper file (data format)`);
    
                    if (chosenServer === 'pg') {
                        FTP.on('ready', () => FTP.put(banData, client.config.ftp.pg.path + 'blockedUserIds.xml', error => {
                            if (error) {
                                interaction.editReply(error.message);
                            } else interaction.editReply('Successfully uploaded ban file for PG');
                        })).connect(client.config.ftp.pg);
                    } else fs.writeFile(`../../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml`, banData, () => interaction.editReply('Successfully uploaded ban file for PS'));
                }
            },
            search: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
                const name = interaction.options.getString('name', true);
                const timeZoneDiff = {
                    ps: new Date().getTimezoneOffset(),
                    pg: 120
                };

                function permIcon(perm: string, key: string) {
                    if (perm === 'true') {
                        return '✅';
                    } else if (perm === 'false') {
                        return '❌';
                    } else if (key === 'timeLastConnected') {
                        const utcDate = new Date(perm);
                        utcDate.setMinutes(utcDate.getMinutes() + timeZoneDiff[chosenServer]);
                        return utcDate.toUTCString();
                    } else return perm;
                }
                function checkPlayer(farmData: farmFormat) {
                    const playerData = farmData.farms.farm[0].players.player.find(x => {
                        if (name.length === 44) {
                            return x._attributes.uniqueUserId === name;
                        } else return x._attributes.lastNickname === name;
                    });
                    if (playerData) {
                        interaction.editReply('```\n' + Object.entries(playerData._attributes).map(x => x[0].padEnd(18, ' ') + permIcon(x[1], x[0])).join('\n') + '```');
                    } else interaction.editReply('No green farm data found with that name/UUID');
                }
                if (chosenServer == 'pg') {
                    FTP.on('ready', () => FTP.get(client.config.ftp.pg.path + 'savegame1/farms.xml', async (err, stream) => {
                        if (err) return interaction.editReply(err.message);

                        checkPlayer(xml2js(await new Response(stream as any).text(), { compact: true }) as farmFormat);
                        stream.once('close', () => FTP.end());
                    })).connect(client.config.ftp.pg);
                } else checkPlayer(xml2js(fs.readFileSync('../../../Documents/My Games/FarmingSimulator2022/savegame1/farms.xml', 'utf8'), { compact: true }) as farmFormat);
            },
            farms: async () => {
                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';

                if (chosenServer == 'pg') {
                    await interaction.deferReply();

                    FTP.on('ready', () => FTP.get(client.config.ftp.pg.path + 'savegame1/farms.xml', (err, stream) => {
                        if (err) return interaction.editReply(err.message);

                        stream.pipe(fs.createWriteStream('../databases/farms.xml'));
                        stream.once('close', () => {
                            FTP.end();
                            interaction.editReply({ files: ['../databases/farms.xml'] });
                        });
                    })).connect(client.config.ftp.pg);
                } else interaction.reply({ files: ['../../../Documents/My Games/FarmingSimulator2022/savegame1/farms.xml'] });
            },
            password: async () => {
                await interaction.deferReply();
                const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
                function getPassword(data: string) {
                    const pw = (xml2js(data, { compact: true }) as any).gameserver?.settings?.game_password?._text as string | undefined;

                    if (pw) {
                        interaction.editReply(`Current password for **${chosenServer.toUpperCase()}** is \`${pw}\``);
                    } else interaction.editReply(`**${chosenServer.toUpperCase()}** doesn't currently have a password set`);
                }

                if (chosenServer === 'pg') {
                    FTP.once('ready', () => FTP.get(client.config.ftp.pg.path + 'dedicated_server/dedicatedServerConfig.xml', async (err, stream) => {
                        if (err) return interaction.editReply(err.message);
                        getPassword(await new Response(stream as any).text());
                        stream.once('close', () => FTP.end());
                    })).connect(client.config.ftp.pg);
                } else getPassword(fs.readFileSync('../../../Documents/My Games/FarmingSimulator2022/dedicated_server/dedicatedServerConfig.xml', 'utf8'));
            },
            roles: async () => {
                if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, "mpmanager");
                const member = interaction.options.getMember("member") as Discord.GuildMember;
                const owner = await interaction.guild.fetchOwner();
                const Role = client.config.mainServer.roles[interaction.options.getString("role", true) as keyof typeof client.config.mainServer.roles];
                let roles = member.roles.cache.map((x, i) => i);
                
                if (member.roles.cache.has(Role)) {
                    (await interaction.reply({
                        embeds: [new client.embed()
                            .setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`)
                            .setColor(client.config.embedColor)
                        ],
                        fetchReply: true,
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId('Yes')
                                .setStyle(ButtonStyle.Success)
                                .setLabel('Confirm'),
                            new ButtonBuilder()
                                .setCustomId('No')
                                .setStyle(ButtonStyle.Danger)
                                .setLabel('Cancel'))
                        ]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 30_000
                    }).on('collect', int => {
                        ({
                            yes: () => {
                                member.edit({ roles: roles.filter(x => x !== Role).filter(x => x !== client.config.mainServer.roles.mpstaff) });
                                int.update({ embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from <@&${Role}>.`).setColor(client.config.embedColor)], components: [] });
                                owner.send(`**${interaction.user.tag}** has demoted **${member.user.tag}** from **${interaction.guild.roles.cache.get(Role)?.name}**`);
                            },
                            no: () => int.update({ embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: [] })
                        } as any)[int.customId]();
                    });
                } else {
                    roles.push(Role);
                    if (Role === client.config.mainServer.roles.mpfarmmanager) roles.push(client.config.mainServer.roles.mpstaff);
                    if (Role === client.config.mainServer.roles.mpjradmin) roles.splice(roles.indexOf(client.config.mainServer.roles.mpfarmmanager), 1);
                    member.edit({ roles });
                    await owner.send(`**${interaction.user.tag}** has promoted **${member.user.tag}** to **${interaction.guild.roles.cache.get(Role)?.name}**`);
                    interaction.reply({ embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given <@&${Role}>.`).setColor(client.config.embedColor)] });
                }
            },
            fm: () => {
                if (client.FMlist._content.includes(name as string)) {
                    client.FMlist.remove(name as string);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    client.FMlist.add(name as string);
                    interaction.reply(`Successfully added \`${name}\``);
                }
            },
            tf: () => {
                if (client.TFlist._content.includes(name as string)) {
                    client.TFlist.remove(name as string);
                    interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    client.TFlist.add(name as string);
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
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' },
                    { name: 'Multi Farm', value: 'mf' })
                .setRequired(true))
            .addStringOption(x=>x
                .setName('action')
                .setDescription('Start or stop the given server')
                .addChoices(
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' })
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('mop')
            .setDescription('Mop a file from a given server')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to manage')
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' })
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
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' })
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
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' })
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
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' })
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('password')
            .setDescription('Fetch the game password for a given server')
            .addStringOption(x=>x
                .setName('server')
                .setDescription('The server to fetch from')
                .addChoices(
                    { name: 'Public Silage', value: 'ps' },
                    { name: 'Public Grain', value: 'pg' })
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
