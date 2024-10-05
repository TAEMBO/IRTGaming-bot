import {
    ApplicationCommandOptionType,
    type CategoryChannel,
    EmbedBuilder,
    OverwriteType,
    type TextChannel,
    PermissionFlagsBits,
    roleMention
} from "discord.js";
import { Command } from "#structures";
import { collectAck, fsServers, onMFFarms, youNeedRole } from "#util";

export default new Command<"chatInput">({
    async autocomplete(interaction) {
        const { commandName } = interaction;
        const serverAcro = commandName + interaction.options.getSubcommandGroup(true);
        const serverObj = fsServers.getPrivateOne(serverAcro);
        const farmRoles = Object.values(serverObj.roles.farms).map(x => interaction.client.mainGuild().roles.cache.get(x)!);

        switch (interaction.options.getSubcommand()) {
            case "member": {
                const displayedRoles = interaction.member.roles.cache.hasAny(...serverObj.managerRoles)
                    ? farmRoles
                    : interaction.member.roles.cache.has(serverObj.roles.farmOwner)
                        ? farmRoles.filter(x => onMFFarms(interaction.member, serverAcro).some(y => x.id === y))
                        : [];

                await interaction.respond(displayedRoles.map(({ name, id }) => ({ name, value: id })));

                break;
            };
            case "rename-role": {
                await interaction.respond(
                    interaction.member.roles.cache.hasAny(...serverObj.managerRoles)
                        ? farmRoles.map(x => ({ name: x.name, value: x.id }))
                        : []
                );

                break;
            };
            case "rename-channel": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await interaction.respond([]);

                const regExp = new RegExp(`${commandName}\\d`);
                const activeFarmChannels = interaction.client.mainGuild()
                    .channels.cache
                    .filter(x => regExp.test(x.name) && x.parentId === serverObj.category);
                const archivedFarmChannels = interaction.client.mainGuild()
                    .channels.cache
                    .filter(x => regExp.test(x.name) && x.parentId === interaction.client.config.mainServer.categories.archived);

                await interaction.respond([
                    ...activeFarmChannels.map(x => ({ name: `(Active) ${x.name}`, value: x.id })),
                    ...archivedFarmChannels.map(x => ({ name: `(Archived) ${x.name}`, value: x.id }))
                ].sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                    return 0;
                }));

                break;
            };
            case "archive": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await interaction.respond([]);

                const regExp = new RegExp(`${commandName}\\d`);
                const activeFarmChannels = interaction.client.mainGuild()
                    .channels.cache
                    .filter(x => regExp.test(x.name) && x.parentId === serverObj.category);
                const archivedFarmChannels = interaction.client.mainGuild()
                    .channels.cache
                    .filter(x => regExp.test(x.name) && x.parentId === interaction.client.config.mainServer.categories.archived);

                await interaction.respond([
                    ...activeFarmChannels.map(x => ({ name: `(Active) ${x.name}`, value: x.id })),
                    ...archivedFarmChannels.map(x => ({ name: `(Archived) ${x.name}`, value: x.id }))
                ].sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                    return 0;
                }));

                break;
            };
        }
    },
    async run(interaction) {
        const { commandName } = interaction;
        const serverAcro = commandName + interaction.options.getSubcommandGroup(true);
        const serverObj = fsServers.getPrivateOne(serverAcro);

        switch (interaction.options.getSubcommand()) {
            case "member": {
                if (
                    !interaction.member.roles.cache.hasAny(...serverObj.managerRoles)
                    && !interaction.member.roles.cache.has(serverObj.roles.farmOwner)
                ) return await youNeedRole(interaction, "mpManager");

                const member = interaction.options.getMember("member");
                const roleId = interaction.options.getString("role", true);
                const validFarmIds = Object.values(serverObj.roles.farms);

                if (!validFarmIds.includes(roleId)) return await interaction.reply("You need to select a valid MF Farm role from the list provided!");

                if (!member) return await interaction.reply({ content: "You need to select a member that's in this server", ephemeral: true });

                if (!member.roles.cache.has(roleId)) {
                    await member.roles.add([roleId, serverObj.roles.member]);

                    return await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`${member} (${member.user.tag}) has been given the <@&${serverObj.roles.member}> and <@&${roleId}> roles`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ]
                    });
                }

                await collectAck({
                    interaction,
                    payload: { embeds: [new EmbedBuilder()
                        .setDescription(`This member already has the <@&${roleId}> role, do you want to remove it from them?`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] },
                    async confirm(int) {
                        const rolesToRemove = onMFFarms(member, serverAcro).length === 1
                            ? [roleId, serverObj.roles.member]
                            : [roleId];

                        await member.roles.remove(rolesToRemove);

                        await int.update({
                            embeds: [new EmbedBuilder()
                                .setDescription(`${member} (${member.user.tag}) has been removed from the ${rolesToRemove.map(roleMention).join(" and ")} role(s).`)
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ],
                            components: []
                        });
                    },
                    async cancel(int) {
                        await int.update({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    },
                    async rejection() {
                        await interaction.editReply({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    }
                });

                break;
            };
            case "owner": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const member = interaction.options.getMember("member");

                if (!member) return await interaction.reply({ content: "You need to select a member that's in this server", ephemeral: true });

                if (!member.roles.cache.has(serverObj.roles.farmOwner)) {
                    await member.roles.add(serverObj.roles.farmOwner);

                    return await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`${member} (${member.user.tag}) has been given the <@&${serverObj.roles.farmOwner}> role`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ]
                    });
                }

                await collectAck({
                    interaction,
                    payload: {
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${serverObj.roles.farmOwner}> role, do you want to remove it from them?`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                    },
                    async confirm(int) {
                        await member.roles.remove(serverObj.roles.farmOwner);

                        await int.update({
                            embeds: [new EmbedBuilder()
                                .setDescription(`${member} (${member.user.tag}) has been removed from the <@&${serverObj.roles.farmOwner}> role`)
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ],
                            components: []
                        });
                    },
                    async cancel(int) {
                        await int.update({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    },
                    async rejection() {
                        await interaction.editReply({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    },
                });

                break;
            };
            case "rename-role": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const roleId = interaction.options.getString("role", true);
                const isValidRole = Object.values(serverObj.roles.farms).includes(roleId);

                if (!isValidRole) return await interaction.reply("You need to select a valid MF Farm role from the list provided!");

                const role = interaction.client.mainGuild().roles.cache.get(roleId)!;
                const name = interaction.options.getString("name", false);
                const roleNamePrefix = role.name.split(" ").slice(0, 3).join(" ");

                await role.setName(name ? `${roleNamePrefix} (${name})` : roleNamePrefix);

                await interaction.reply(`${roleNamePrefix} role name set to \`${role.name}\``);

                break;
            };
            case "rename-channel": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const channelId = interaction.options.getString("channel", true);
                const channel = interaction.client.channels.cache.get(channelId) as TextChannel | undefined;

                if (!channel || !new RegExp(serverAcro).test(channel.name)) return await interaction.reply("You need to select a channel from the list provided!");

                const farmNumber = channel.name.match(/\d/)![0];
                const role = interaction.client.mainGuild().roles.cache.get(serverObj.roles.farms[farmNumber])!;
                const farmName = role.name.slice(role.name.indexOf("(") + 1, -1);

                await channel.setName(`${channel.name.slice(0, channel.name.indexOf("-"))}-${farmName}`);

                await interaction.reply(`${channel} name successfully updated`);

                break;
            };
            case "archive": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const channelId = interaction.options.getString("channel", true);
                const channel = interaction.client.channels.cache.get(channelId) as TextChannel | undefined;

                if (!channel || !new RegExp(serverAcro).test(channel.name)) return await interaction.reply("You need to select a channel from the list provided!");

                const { archived } = interaction.client.config.mainServer.categories;
                const channelisActive = channel.parentId === serverObj.category;

                if (channelisActive) { // Channel currently active, change to archived
                    await channel.edit({
                        parent: archived,
                        permissionOverwrites: [
                            ...(interaction.client.channels.cache.get(archived) as CategoryChannel).permissionOverwrites.cache.values(),
                            {
                                id: interaction.client.config.mainServer.roles.mpManager,
                                allow: PermissionFlagsBits.ViewChannel,
                                type: OverwriteType.Role
                            }
                        ]
                    });

                    await interaction.reply(`${channel} successfully set to archived`);
                } else { // Channel currently archived, change to active
                    await channel.edit({
                        parent: serverObj.category,
                        permissionOverwrites: [
                            {
                                id: interaction.client.config.mainServer.id,
                                deny: PermissionFlagsBits.ViewChannel,
                                type: OverwriteType.Role
                            },
                            {
                                id: serverObj.roles.farmOwner,
                                allow: [PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.ManageMessages],
                                type: OverwriteType.Role
                            },
                            {
                                id: serverObj.roles.farms[channel.name.slice(4, 5)],
                                allow: PermissionFlagsBits.ViewChannel,
                                type: OverwriteType.Role
                            },
                            {
                                id: interaction.client.config.mainServer.roles.mpManager,
                                allow: PermissionFlagsBits.ViewChannel,
                                type: OverwriteType.Role
                            }
                        ]
                    });

                    await interaction.reply(`${channel} successfully set to active`);
                }

                break;
            };
            case "apply": {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                await interaction.reply(serverObj.form);

                break;
            };
        }
    },
    data: {
        name: "mf",
        description: "MF management",
        options: fsServers.getPrivateAll().map(([serverAcro, server]) => ({
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: serverAcro.replace("mf", ""),
            description: `${server.fullName} management`,
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "member",
                    description: "Manage MF farm members",
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "member",
                            description: "The member to add or remove a role from",
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "role",
                            description: "The role to add or remove",
                            autocomplete: true,
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "owner",
                    description: "Manage MF farm owners",
                    options: [
                        {
                            type: ApplicationCommandOptionType.User,
                            name: "member",
                            description: "The member to add or remove the MF Farm Owner role from",
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "rename-role",
                    description: "Rename a given MF Farm role",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "role",
                            description: "The role to rename",
                            autocomplete: true,
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "rename-channel",
                    description: "Update the name of a given MF Farm channel",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "channel",
                            description: "The channel to rename",
                            autocomplete: true,
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "archive",
                    description: "Manage archivement of MF Farm channels",
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: "channel",
                            description: "The MF Farm channel to manage archivement of",
                            autocomplete: true,
                            required: true
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "apply",
                    description: "Send the Google Form to apply to be an MF Farm Owner"
                }
            ]
        }))
    }
});