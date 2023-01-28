
import Discord, { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} from 'discord.js';
import YClient from '../client';
import puppeteer from 'puppeteer'; // Credits to Trolly for suggesting this package
import FTPClient from 'ftp';
import fs from 'node:fs';
import xjs from 'xml-js';
import { banFormat, FSCacheServer, FSURLs } from 'interfaces';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, "mpstaff");
        const subCmd = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        if (subCmd == 'server') {
            if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, 'mpmanager');
            await interaction.deferReply();
            const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg' | 'mf';
            const chosenAction = interaction.options.getString('action', true) as 'start' | 'stop';
            const serverSelector = `[name="${chosenAction}_server"]`;
            const time = Date.now();
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            if ((client.FSCache[chosenServer] as FSCacheServer).status == 0 && chosenAction== 'stop') return interaction.editReply('Server is already offline');
            if ((client.FSCache[chosenServer] as FSCacheServer).status == 1 && chosenAction == 'start') return interaction.editReply('Server is already online');

            try {
                await page.goto((client.tokens[chosenServer] as FSURLs).login, { timeout: 120000 });
            } catch (err: any) {
                interaction.editReply(err.message);
                return;
            }
            await interaction.editReply(`Connected to dedi panel for **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**...`);

            let result = 'Dedi panel closed, result:\n';
            result += `Server: **${chosenServer.toUpperCase()}**\n`;
            result += `Action: **${chosenAction}**\n`;
            if (chosenAction == 'stop') {
                const uptimeText = await page.evaluate(()=>(document.querySelector("span.monitorHead") as Element).textContent);
                result += `Uptime before stopping: **${uptimeText}**\n`;
            };

            page.waitForSelector(serverSelector).then(() => {
                page.click(serverSelector).then(() => {
                    setTimeout(async () => {
                        await browser.close();
                        interaction.editReply(result += `Total time taken: **${Date.now() - time}ms**`);
                    }, 2000);
                });
            });
        } else if (subCmd == 'mop') {
            if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, 'mpmanager');
            const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
            const chosenAction = interaction.options.getString('action', true) as 'items.xml' | 'players.xml';
            
            if ((client.FSCache[chosenServer] as FSCacheServer).status == 1) return interaction.reply(`You cannot mop files from **${chosenServer.toUpperCase()}** while it is online`);
            if (chosenServer != 'pg' && chosenAction == 'items.xml') return interaction.reply(`You can only mop **${chosenAction}** from **PG**`);
            
            await interaction.deferReply();
            const FTPLogin = client.tokens.ftp[chosenServer];
            const time = Date.now();
            const FTP = new FTPClient();

            FTP.on('ready', async () => {
                FTP.delete(FTPLogin.path + `savegame1/${chosenAction}`, async (err) => {
                    if (err) return interaction.editReply(err.message);
                    await interaction.editReply(`Successfully deleted **${chosenAction}** from **${chosenServer.toUpperCase()}** after **${Date.now() - time}ms**`);
                    FTP.end();
                });
            });

            FTP.connect(FTPLogin);
        } else if (subCmd == 'bans') {
            if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, "mpmanager");

            const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
            const chosenAction = interaction.options.getString('action', true) as 'dl' | 'ul';

            await interaction.deferReply();
            const FTP = new FTPClient();

            if (chosenAction == 'dl') {
                if (chosenServer == 'pg') {
                    FTP.connect(client.tokens.ftp.pg);
                    FTP.on('ready', async () => {
                        console.log(client.timeLog('\x1b[33m'), 'Connected to FTP for PG');
                        FTP.get(client.tokens.ftp.pg.path + 'blockedUserIds.xml', async (err, stream) => {
                            if (err) return interaction.editReply(err.message);
                            console.log(client.timeLog('\x1b[33m'), 'Downloaded PG bans');
                            stream.once('close', ()=>FTP.end());
                            stream.pipe(fs.createWriteStream('./databases/blockedUserIds.xml'));
    
                            console.log(client.timeLog('\x1b[33m'), `Write via ${client.tokens.ftp.pg.path}`);
                            setTimeout(() => interaction.editReply({files: ['./databases/blockedUserIds.xml']}), 1000);
                        });
                    });
                } else {
                    interaction.editReply({files: ['../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml']});
                }
            } else {
                let data: banFormat;
                const banAttachment = interaction.options.getAttachment('bans');
                if (!banAttachment) return interaction.editReply(`Canceled: A ban file must be supplied`);

                const banData = await fetch(banAttachment.url).then((res) => res.text());
                console.log(client.timeLog('\x1b[33m'), `Discord API; Downloaded ${banAttachment.name}`);
                try {
                    data = xjs.xml2js(banData, {compact: true}) as banFormat;
                } catch (err) {
                    return interaction.editReply(`Canceled: Improper file (not XML)`);
                }

                if (!data.blockedUserIds?.user[0]?._attributes?.displayName) return interaction.editReply(`Canceled: Improper file (data format)`);

                if (chosenServer == 'pg') {
                    FTP.connect(client.tokens.ftp.pg);
                    FTP.on('ready', async () => {
                        console.log(client.timeLog('\x1b[33m'), 'Connected to FTP for PG');
                        FTP.put(banData, client.tokens.ftp.pg.path + 'blockedUserIds.xml', async (error) => {
                            if (error) {
                                interaction.editReply(error.message);
                            } else {
                                console.log(client.timeLog('\x1b[33m'), 'Uploaded PG bans');
                                interaction.editReply('Successfully uploaded ban file for PG');
                            }

                        });
                    });
                } else {
                    fs.writeFileSync(`../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml`, banData);
                    interaction.editReply('Successfully uploaded ban file for PS');
                }
            }

        } else if (subCmd == 'roles') {
            if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, "mpmanager");
            const member = interaction.options.getMember("member") as Discord.GuildMember;
            const owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
            const Role = client.config.mainServer.roles[interaction.options.getString("role", true)];
            
            if(member.roles.cache.has(Role)){
                const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle(ButtonStyle.Success).setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle(ButtonStyle.Danger).setLabel("Cancel"))]});
                const filter = (i: any) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
                const collector = msg.createMessageComponentCollector({filter, max: 1, time: 30000});
                collector.on("collect", async (int: Discord.MessageComponentInteraction) => {
                    if(int.customId === "Yes"){
                        member.roles.remove(Role);
                        member.roles.remove(client.config.mainServer.roles.mpstaff);
                        int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from <@&${Role}>.`).setColor(client.config.embedColor)], components: []})
                        await owner.send(`**${interaction.user.tag}** has demoted **${member.user.tag}** from **${(interaction.guild.roles.cache.get(Role) as Discord.Role).name}**`)
                    } else if(int.customId === "No"){
                        int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                    }
                });
            } else {
                member.roles.add(Role);
                if (Role !== client.config.mainServer.roles.trustedfarmer) member.roles.add(client.config.mainServer.roles.mpstaff);
                await owner.send(`**${interaction.user.tag}** has promoted **${member.user.tag}** to **${(interaction.guild.roles.cache.get(Role) as Discord.Role).name}**`)
                interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given <@&${Role}>.`).setColor(client.config.embedColor)]});
            }
        } else if (subCmd == 'fm') {
            if (client.FMstaff._content.includes(name)) {
                client.FMstaff.removeData(name, 0, undefined).forceSave();
                interaction.reply(`Player name already exists, successfully removed \`${name}\``);
            } else {
                client.FMstaff.addData(name).forceSave();
                interaction.reply(`Player name doesn't exist, successfully added \`${name}\``);
            }
        } else if (subCmd == 'tf') {
            if (client.TFstaff._content.includes(name)) {
                client.TFstaff.removeData(name, 0, undefined).forceSave();
                interaction.reply(`Player name already exists, successfully removed \`${name}\``);
            } else {
                client.TFstaff.addData(name).forceSave();
                interaction.reply(`Player name doesn't exist, successfully added \`${name}\``);
            }
        }
	},
    data: new SlashCommandBuilder()
    .setName("mp")
    .setDescription("Manage MP members")
    .addSubcommand(x=>x
        .setName('server')
        .setDescription('Turn a given server on or off')
        .addStringOption(x=>x
            .setName('server')
            .setDescription('The server to manage')
            .addChoices(
                {name: 'Public Silage', value: 'ps'},
                {name: 'Public Grain', value: 'pg'},
                {name: 'Multi Farm', value: 'mf'}
            )
            .setRequired(true)
        )
        .addStringOption(x=>x
            .setName('action')
            .setDescription('Start or stop the given server')
            .addChoices(
                {name: 'Start', value: 'start'},
                {name: 'Stop', value: 'stop'}
            )
            .setRequired(true)
        )
    )
    .addSubcommand(x=>x
        .setName('mop')
        .setDescription('Mop a file from a given server')
        .addStringOption(x=>x
            .setName('server')
            .setDescription('The server to manage')
            .addChoices(
                {name: 'Public Silage', value: 'ps'},
                {name: 'Public Grain', value: 'pg'}
            )
            .setRequired(true)
        )
        .addStringOption(x=>x
            .setName('action')
            .setDescription('The action to perform on the given server')
            .addChoices(
                {name: 'Mop players.xml', value: 'players.xml'},
                {name: 'Mop items.xml', value: 'items.xml'}
            )
            .setRequired(true)
        )
    )
    .addSubcommand(x=>x
        .setName('bans')
        .setDescription('Manage ban lists for servers')
        .addStringOption(x=>x
            .setName('server')
            .setDescription('The server to manage')
            .addChoices(
                {name: 'Public Silage', value: 'ps'},
                {name: 'Public Grain', value: 'pg'}
            )
            .setRequired(true)
        )
        .addStringOption(x=>x
            .setName('action')
            .setDescription('To download or upload a ban file')
            .addChoices(
                {name: 'Download', value: 'dl'},
                {name: 'Upload', value: 'ul'}
            )
            .setRequired(true)
        )
        .addAttachmentOption(x=>x
            .setName('bans')
            .setDescription('The ban file if uploading')
            .setRequired(false))
    )
    .addSubcommand(x=>x
        .setName('roles')
        .setDescription('Give or take MP Staff roles')
        .addUserOption(x=>x
            .setName("member")
            .setDescription("The member to add or remove the role from")
            .setRequired(true)
        )
        .addStringOption(x=>x
            .setName("role")
            .setDescription("the role to add or remove")
            .addChoices(
                {name: 'Trusted Farmer', value: 'trustedfarmer'},
                {name: 'Farm Manager', value: 'mpfarmmanager'},
                {name: 'Public Admin', value: 'mppublicadmin'}
            )
            .setRequired(true)
        )
    )
    .addSubcommand(x=>x
        .setName('fm')
        .setDescription('Add or remove player names in FM list')
        .addStringOption(x=>x
            .setName('name')
            .setDescription('The player name to add or remove')
            .setRequired(true)
        )
    )
    .addSubcommand(x=>x
        .setName('tf')
        .setDescription('Add or remove player names in TF list')
        .addStringOption(x=>x
            .setName('name')
            .setDescription('The player name to add or remove')
            .setRequired(true)
        )
    )
};
