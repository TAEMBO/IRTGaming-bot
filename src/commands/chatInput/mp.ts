import { AttachmentBuilder, ComponentType, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Routes } from "farming-simulator-types/2022";
import puppeteer from "puppeteer"; // Credits to Trolly for suggesting this package
import { Command, FTPActions } from "#structures";
import { ACK_BUTTONS, fsServers, hasRole, isMPStaff, jsonFromXML, youNeedRole } from "#util";
import type { BanFormat, DedicatedServerConfig, FarmFormat } from "#typings";

const cmdOptionChoices = fsServers.getPublicAll().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro }));

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpStaff");

        const now = Date.now();

        switch (interaction.options.getSubcommand()) {
            case "server": {
                const chosenServer = interaction.options.getString("server", true);
                const chosenAction = interaction.options.getString("action", true) as "start" | "stop" | "restart";
                const cachedServer = interaction.client.fsCache[chosenServer];
                const configServer = interaction.client.config.fs[chosenServer];

                if (!interaction.member.roles.cache.hasAny(...configServer.managerRoles))
                    return await youNeedRole(interaction, "mpManager");

                if (cachedServer.state === null) return await interaction.reply("Cache not populated, retry in 30 seconds");

                if (cachedServer.state === 0 && ["stop", "restart"].includes(chosenAction))
                    return await interaction.reply("Server is already offline");

                if (cachedServer.state === 1 && chosenAction === "start") return await interaction.reply("Server is already online");

                if (cachedServer.players.length) {
                    const message = await interaction.reply({
                        content: `There are players currently on **${configServer.fullName}**, are you sure you want to manage its state?`,
                        components: ACK_BUTTONS,
                        fetchReply: true,
                    });

                    try {
                        const collected = await message.awaitMessageComponent({
                            filter: x => x.user.id === interaction.user.id,
                            time: 15_000,
                            componentType: ComponentType.Button,
                        });

                        if (collected.customId === "confirm") {
                            await collected.update({ content: "Continuing...", components: [] });
                        } else {
                            return await collected.update({ content: "Command canceled", components: [] });
                        }
                    } catch (err) {
                        return await interaction.editReply({ content: "Command canceled", components: [] });
                    }
                } else await interaction.deferReply();

                const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
                const page = await browser.newPage();

                try {
                    await page.goto(configServer.url + Routes.webPageLogin(configServer.username, configServer.password), {
                        timeout: 120_000,
                    });
                } catch (err: any) {
                    return await interaction.editReply(err.message);
                }

                await interaction.editReply(
                    `Connected to dedi panel for **${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**...`,
                );

                let result = "Successfully ";
                let uptimeText: string | null | undefined;

                await {
                    start() {
                        result += "started ";
                    },
                    async stop() {
                        result += "stopped ";

                        const uptime = await page.evaluate(() => document.querySelector("span.monitorHead")!.textContent!);

                        uptimeText = `. Uptime before stopping: **${uptime}**`;
                    },
                    async restart() {
                        result += "restarted ";
                        await interaction.client.getChan("fsLogs").send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle(`${chosenServer.toUpperCase()} now restarting`)
                                    .setColor(interaction.client.config.EMBED_COLOR_YELLOW)
                                    .setTimestamp()
                                    .setFooter({ text: "\u200b", iconURL: interaction.user.displayAvatarURL() }),
                            ],
                        });

                        const uptime = await page.evaluate(() => document.querySelector("span.monitorHead")!.textContent!);

                        uptimeText = `. Uptime before restarting: **${uptime}**`;
                    },
                }[chosenAction]();

                await page.waitForSelector(`[name="${chosenAction}_server"]`).then(x => x!.click());

                result += `**${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**`;

                if (uptimeText) result += uptimeText;

                await interaction.editReply(result);

                setTimeout(() => browser.close(), 5_000);

                break;
            }
            case "mop": {
                if (!hasRole(interaction.member, "mpManager")) return await youNeedRole(interaction, "mpManager");

                const chosenServer = interaction.options.getString("server", true);
                const chosenAction = interaction.options.getString("action", true) as "items.xml" | "players.xml";

                if (interaction.client.fsCache[chosenServer].state === 1)
                    return await interaction.reply(`You cannot mop files from **${chosenServer.toUpperCase()}** while it is online`);

                await interaction.deferReply();

                await new FTPActions(fsServers.getPublicOne(chosenServer).ftp).delete(`savegame1/${chosenAction}`);

                await interaction.editReply(
                    `Successfully deleted **${chosenAction}** from **${chosenServer.toUpperCase()}** after **${Date.now() - now}ms**`,
                );

                break;
            }
            case "bans": {
                const chosenServer = interaction.options.getString("server", true);
                const chosenAction = interaction.options.getString("action", true) as "dl" | "ul";
                const ftpActions = new FTPActions(fsServers.getPublicOne(chosenServer).ftp);

                if (chosenAction === "dl") {
                    await interaction.deferReply();

                    const data = await ftpActions.get("blockedUserIds.xml");

                    return await interaction.editReply({
                        files: [new AttachmentBuilder(Buffer.from(data), { name: "blockedUserIds.xml" })],
                    });
                }

                if (!hasRole(interaction.member, "mpManager")) return await youNeedRole(interaction, "mpManager");

                await interaction.deferReply();

                let data;
                const banAttachment = interaction.options.getAttachment("bans");

                if (!banAttachment) return await interaction.editReply("Canceled: A ban file must be supplied");

                const banData = await (await fetch(banAttachment.url)).text();

                try {
                    data = jsonFromXML<BanFormat>(banData);
                } catch (err) {
                    return await interaction.editReply("Canceled: Improper file (not XML)");
                }

                if (!data.blockedUserIds?.user[0]?._attributes?.displayName)
                    return await interaction.editReply("Canceled: Improper file (data format)");

                await ftpActions.put(banData, "blockedUserIds.xml");

                await interaction.editReply(
                    `Successfully uploaded ban file for ${chosenServer.toUpperCase()} after **${Date.now() - now}ms**`,
                );

                break;
            }
            case "search": {
                await interaction.deferReply();

                const chosenServer = interaction.options.getString("server", true);
                const name = interaction.options.getString("name", true);

                function permIcon(perm: string, key: string) {
                    if (perm === "true") {
                        return "✅";
                    } else if (perm === "false") {
                        return "❌";
                    } else if (key === "timeLastConnected") {
                        const utcDate = new Date(perm);

                        utcDate.setMinutes(
                            utcDate.getMinutes() - utcDate.getTimezoneOffset() + fsServers.getPublicOne(chosenServer).utcDiff,
                        );

                        return utcDate.toUTCString();
                    } else return perm;
                }

                const data = await new FTPActions(fsServers.getPublicOne(chosenServer).ftp).get("savegame1/farms.xml");
                const farmData = jsonFromXML<FarmFormat>(data);
                const playerData = farmData.farms.farm[0].players.player.find(
                    x => (name.length === 44 ? x._attributes.uniqueUserId : x._attributes.lastNickname) === name,
                );

                await interaction.editReply(
                    playerData
                        ? "```\n" +
                              Object.entries(playerData._attributes)
                                  .map(x => x[0].padEnd(18, " ") + permIcon(x[1], x[0]))
                                  .join("\n") +
                              "```"
                        : "No green farm data found with that name/UUID",
                );

                break;
            }
            case "pair": {
                const uuid = interaction.options.getString("uuid", true);
                const user = interaction.options.getUser("user", true);
                const playerData = await interaction.client.playerTimes.data.findOne({ uuid });

                if (!playerData) return await interaction.reply("No playerTimes data found with that UUID");

                playerData.discordid = user.id;

                await playerData.save();

                await interaction.reply(
                    `Successfully paired Discord account \`${user.tag}\` to in-game UUID \`${playerData.uuid}\` (${playerData._id})`,
                );

                break;
            }
            case "farms": {
                const chosenServer = interaction.options.getString("server", true);
                const serverConfig = interaction.client.config.fs[chosenServer];

                if (!interaction.member.roles.cache.hasAny(...serverConfig.managerRoles))
                    return await youNeedRole(interaction, "mpManager");

                await interaction.deferReply();

                const data = await new FTPActions(serverConfig.ftp).get("savegame1/farms.xml");

                await interaction.editReply({ files: [new AttachmentBuilder(Buffer.from(data), { name: "farms.xml" })] });

                break;
            }
            case "password": {
                await interaction.deferReply();

                const chosenServer = interaction.options.getString("server", true);
                const data = await new FTPActions(fsServers.getPublicOne(chosenServer).ftp).get(
                    "dedicated_server/dedicatedServerConfig.xml",
                );
                const pw = jsonFromXML<DedicatedServerConfig>(data).gameserver.settings.game_password._text;

                await interaction.editReply(
                    pw
                        ? `Current password for **${chosenServer.toUpperCase()}**  \`${pw}\``
                        : `Password not set for **${chosenServer.toUpperCase()}**`,
                );

                break;
            }
            case "roles": {
                if (!hasRole(interaction.member, "mpManager")) return await youNeedRole(interaction, "mpManager");

                const member = interaction.options.getMember("member");
                const mainRoles = interaction.client.config.mainServer.roles;

                if (!member)
                    return await interaction.reply({
                        content: "You need to select a member that is in this server",
                        ephemeral: true,
                    });

                const roleName = interaction.options.getString("role", true) as
                    | "trustedFarmer"
                    | "mpFarmManager"
                    | "mpJrAdmin"
                    | "mpSrAdmin";
                const roleId = mainRoles[roleName];
                const roles = [...member.roles.cache.keys()];

                if (member.roles.cache.has(roleId)) {
                    (
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`This user already has the <@&${roleId}> role, do you want to remove it from them?`)
                                    .setColor(interaction.client.config.EMBED_COLOR),
                            ],
                            fetchReply: true,
                            components: ACK_BUTTONS,
                        })
                    )
                        .createMessageComponentCollector({
                            filter: x => x.user.id === interaction.user.id,
                            max: 1,
                            time: 30_000,
                            componentType: ComponentType.Button,
                        })
                        .on("collect", async int => {
                            if (int.customId === "cancel") {
                                return await int.update({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setDescription("Command canceled")
                                            .setColor(interaction.client.config.EMBED_COLOR),
                                    ],
                                    components: [],
                                });
                            }

                            if (roleName !== "trustedFarmer") {
                                const slicedNick = {
                                    mpFarmManager: "MP Farm Manager",
                                    mpJrAdmin: "MP Jr. Admin",
                                    mpSrAdmin: "MP Sr. Admin",
                                }[roleName];

                                await member.edit({
                                    roles: roles
                                        .filter(x => x !== roleId && x !== mainRoles.mpStaff)
                                        .concat([mainRoles.formerStaff, mainRoles.trustedFarmer]),
                                    nick: member.nickname!.replace(slicedNick, "Former Staff"),
                                });
                            } else await member.roles.remove(roleId);

                            await int.update({
                                embeds: [
                                    new EmbedBuilder()
                                        .setDescription(`${member} has been removed from <@&${roleId}>.`)
                                        .setColor(interaction.client.config.EMBED_COLOR),
                                ],
                                components: [],
                            });

                            await interaction.client.users.send(
                                interaction.guild.ownerId,
                                `**${interaction.user.tag}** has demoted **${member.user.tag}** from **${interaction.client.getRole(roleName).name}**`,
                            );
                        });
                } else {
                    const newNickname = {
                        trustedFarmer() {
                            roles.push(roleId);

                            return undefined;
                        },
                        mpFarmManager() {
                            roles.push(roleId, mainRoles.mpStaff);
                            roles.splice(roles.indexOf(mainRoles.trustedFarmer), 1);

                            return `${member.displayName.slice(0, 14)} | MP Farm Manager`;
                        },
                        mpJrAdmin() {
                            roles.push(roleId);
                            roles.splice(roles.indexOf(mainRoles.mpFarmManager), 1);

                            return member.nickname!.replace("MP Farm Manager", "MP Jr. Admin");
                        },
                        mpSrAdmin() {
                            roles.push(roleId);
                            roles.splice(roles.indexOf(mainRoles.mpJrAdmin), 1);

                            return member.nickname!.replace("MP Jr. Admin", "MP Sr. Admin");
                        },
                    }[roleName]();

                    await member.edit({ roles, nick: newNickname });
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`${member} has been given <@&${roleId}>.`)
                                .setColor(interaction.client.config.EMBED_COLOR),
                        ],
                    });
                    await interaction.client.users.send(
                        interaction.guild.ownerId,
                        `**${interaction.user.tag}** has promoted **${member.user.tag}** to **${interaction.client.getRole(roleName).name}**`,
                    );
                }

                break;
            }
            case "fm": {
                const name = interaction.options.getString("name", true);

                if (interaction.client.fmList.cache.includes(name)) {
                    await interaction.client.fmList.remove(name);
                    await interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    await interaction.client.fmList.add(name);
                    await interaction.reply(`Successfully added \`${name}\``);
                }

                break;
            }
            case "tf": {
                const name = interaction.options.getString("name", true);

                if (interaction.client.tfList.cache.includes(name)) {
                    await interaction.client.tfList.remove(name);
                    await interaction.reply(`Successfully removed \`${name}\``);
                } else {
                    await interaction.client.tfList.add(name);
                    await interaction.reply(`Successfully added \`${name}\``);
                }

                break;
            }
        }
    },
    data: new SlashCommandBuilder()
        .setName("mp")
        .setDescription("All things multiplayer-related")
        .addSubcommand(x =>
            x
                .setName("server")
                .setDescription("Turn a given server on or off")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to manage")
                        .addChoices(...fsServers.entries().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro })))
                        .setRequired(true),
                )
                .addStringOption(x =>
                    x
                        .setName("action")
                        .setDescription("Start or stop the given server")
                        .addChoices(
                            { name: "Start", value: "start" },
                            { name: "Stop", value: "stop" },
                            { name: "Restart", value: "restart" },
                        )
                        .setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("mop")
                .setDescription("Mop a file from a given server")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to manage")
                        .addChoices(...cmdOptionChoices)
                        .setRequired(true),
                )
                .addStringOption(x =>
                    x
                        .setName("action")
                        .setDescription("The action to perform on the given server")
                        .addChoices({ name: "Mop players.xml", value: "players.xml" }, { name: "Mop items.xml", value: "items.xml" })
                        .setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("bans")
                .setDescription("Manage ban lists for servers")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to manage")
                        .addChoices(...cmdOptionChoices)
                        .setRequired(true),
                )
                .addStringOption(x =>
                    x
                        .setName("action")
                        .setDescription("To download or upload a ban file")
                        .addChoices({ name: "Download", value: "dl" }, { name: "Upload", value: "ul" })
                        .setRequired(true),
                )
                .addAttachmentOption(x => x.setName("bans").setDescription("The ban file if uploading").setRequired(false)),
        )
        .addSubcommand(x =>
            x
                .setName("search")
                .setDescription("Fetch farm data for a player")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to search on")
                        .addChoices(...cmdOptionChoices)
                        .setRequired(true),
                )
                .addStringOption(x => x.setName("name").setDescription("The name of the player to search for").setRequired(true)),
        )
        .addSubcommand(x =>
            x
                .setName("pair")
                .setDescription("Manually pair a UUID with a Discord account for informational purposes")
                .addStringOption(x => x.setName("uuid").setDescription("The UUID of the in-game player").setRequired(true))
                .addUserOption(x =>
                    x.setName("user").setDescription("The Discord account to pair with the in-game player").setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("farms")
                .setDescription("Download farms.xml from a server")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to fetch from")
                        .addChoices(...fsServers.entries().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro })))
                        .setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("password")
                .setDescription("Fetch the game password for a given server")
                .addStringOption(x =>
                    x
                        .setName("server")
                        .setDescription("The server to fetch from")
                        .addChoices(...cmdOptionChoices)
                        .setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("roles")
                .setDescription("Give or take MP Staff roles")
                .addUserOption(x => x.setName("member").setDescription("The member to add or remove the role from").setRequired(true))
                .addStringOption(x =>
                    x
                        .setName("role")
                        .setDescription("the role to add or remove")
                        .addChoices(
                            { name: "Trusted Farmer", value: "trustedFarmer" },
                            { name: "Farm Manager", value: "mpFarmManager" },
                            { name: "Junior Admin", value: "mpJrAdmin" },
                            { name: "Senior Admin", value: "mpSrAdmin" },
                        )
                        .setRequired(true),
                ),
        )
        .addSubcommand(x =>
            x
                .setName("fm")
                .setDescription("Add or remove player names in FM list")
                .addStringOption(x => x.setName("name").setDescription("The player name to add or remove").setRequired(true)),
        )
        .addSubcommand(x =>
            x
                .setName("tf")
                .setDescription("Add or remove player names in TF list")
                .addStringOption(x => x.setName("name").setDescription("The player name to add or remove").setRequired(true)),
        ),
});
