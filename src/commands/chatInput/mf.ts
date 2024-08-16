import {
    type CategoryChannel,
    ComponentType,
    EmbedBuilder,
    OverwriteType,
    SlashCommandBuilder,
    type TextChannel,
    PermissionFlagsBits
} from "discord.js";
import { Command } from "#structures";
import { ACK_BUTTONS, fsServers, lookup, onMFFarms, youNeedRole } from "#util";

const cmdBuilderData = new SlashCommandBuilder()
    .setName("mf")
    .setDescription("MF management");

for (const [serverAcro, server]  of fsServers.getPrivateAll()) cmdBuilderData.addSubcommandGroup(x => x
    .setName(serverAcro.replace("mf", ""))
    .setDescription(`${server.fullName} management`)
    .addSubcommand(x => x
        .setName("member")
        .setDescription("Manage MF farm members")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to add or remove a role from")
            .setRequired(true))
        .addStringOption(x => x
            .setName("role")
            .setDescription("The role to add or remove")
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(x => x
        .setName("owner")
        .setDescription("Manage MF farm owners")
        .addUserOption(x => x
            .setName("member")
            .setDescription("The member to add or remove the MF Farm Owner role from")
            .setRequired(true)))
    .addSubcommand(x => x
        .setName("rename-role")
        .setDescription("Rename a given MF Farm role")
        .addStringOption(x => x
            .setName("role")
            .setDescription("The role to rename")
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(x => x
            .setName("name")
            .setDescription("The name of the MF Farm. Leave unspecified to clear farm name in role")
            .setRequired(false)))
    .addSubcommand(x => x
        .setName("rename-channel")
        .setDescription("Update the name of a given MF Farm channel")
        .addStringOption(x => x
            .setName("channel")
            .setDescription("The channel to rename")
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(x => x
        .setName("archive")
        .setDescription("Manage archivement of MF Farm channels")
        .addStringOption(x => x
            .setName("channel")
            .setDescription("The MF Farm channel to manage archivement of")
            .setAutocomplete(true)
            .setRequired(true)))
    .addSubcommand(x => x
        .setName("apply")
        .setDescription("Send the Google Form to apply to be an MF Farm Owner"))
);

export default new Command<"chatInput">({
    async autocomplete(interaction) {
        const { commandName } = interaction;
        const serverAcro = commandName + interaction.options.getSubcommandGroup(true);
        const serverObj = fsServers.getPrivateOne(serverAcro);
        const farmRoles = Object.values(serverObj.roles.farms).map(x => interaction.client.mainGuild().roles.cache.get(x)!);

        await lookup({
            async member() {
                const displayedRoles = interaction.member.roles.cache.hasAny(...serverObj.managerRoles)
                    ? farmRoles
                    : interaction.member.roles.cache.has(serverObj.roles.farmOwner)
                        ? farmRoles.filter(x => onMFFarms(interaction.member, serverAcro).some(y => x.id === y))
                        : [];

                await interaction.respond(displayedRoles.map(({ name, id }) => ({ name, value: id })));
            },
            async "rename-role"() {
                await interaction.respond(
                    interaction.member.roles.cache.hasAny(...serverObj.managerRoles)
                        ? farmRoles.map(x => ({ name: x.name, value: x.id }))
                        : []
                );
            },
            async "rename-channel"() {
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
            },
            async archive() {
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
            }
        }, interaction.options.getSubcommand());
    },
    async run(interaction) {
        const { commandName } = interaction;
        const serverAcro = commandName + interaction.options.getSubcommandGroup(true);
        const serverObj = fsServers.getPrivateOne(serverAcro);

        await lookup({
            async member() {
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
                            .setDescription(`${member} (${member.user.tag}) has been given the <@&${serverObj.roles.member}> and <@&${roleId}> roles.`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ]
                    });
                }

                (await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`This member already has the <@&${roleId}> role, do you want to remove it from them?`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ],
                    fetchReply: true,
                    components: ACK_BUTTONS
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 30_000,
                    componentType: ComponentType.Button
                }).on("collect", int => void lookup({
                    async confirm() {
                        const rolesToRemove = onMFFarms(member, serverAcro).length === 1
                            ? [roleId, serverObj.roles.member]
                            : [roleId];

                        await member.roles.remove(rolesToRemove);

                        await int.update({
                            embeds: [new EmbedBuilder()
                                .setDescription(`${member} (${member.user.tag}) has been removed from the ${rolesToRemove.map(x => `<@&${x}>`).join(" and ")} role(s).`)
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ],
                            components: []
                        });
                    },
                    cancel() {
                        return int.update({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    }
                }, int.customId));
            },
            async owner() {
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

                (await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`This member already has the <@&${serverObj.roles.farmOwner}> role, do you want to remove it from them?`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ],
                    fetchReply: true,
                    components: ACK_BUTTONS
                })).createMessageComponentCollector({
                    filter: x => x.user.id === interaction.user.id,
                    max: 1,
                    time: 30_000,
                    componentType: ComponentType.Button
                }).on("collect", int => void lookup({
                    async confirm() {
                        await member.roles.remove(serverObj.roles.farmOwner);

                        await int.update({
                            embeds: [new EmbedBuilder()
                                .setDescription(`${member} (${member.user.tag}) has been removed from the <@&${serverObj.roles.farmOwner}> role`)
                                .setColor(interaction.client.config.EMBED_COLOR)
                            ],
                            components: []
                        });
                    },
                    cancel() {
                        return int.update({
                            embeds: [new EmbedBuilder().setDescription("Command canceled").setColor(interaction.client.config.EMBED_COLOR)],
                            components: []
                        });
                    }
                }, int.customId));
            },
            async "rename-role"() {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const roleId = interaction.options.getString("role", true);
                const isValidRole = Object.values(serverObj.roles.farms).includes(roleId);

                if (!isValidRole) return await interaction.reply("You need to select a valid MF Farm role from the list provided!");

                const role = interaction.client.mainGuild().roles.cache.get(roleId)!;
                const name = interaction.options.getString("name", false);
                const roleNamePrefix = role.name.split(" ").slice(0, 3).join(" ");

                await role.setName(name ? `${roleNamePrefix} (${name})` : roleNamePrefix);

                await interaction.reply(`${roleNamePrefix} role name set to \`${role.name}\``);
            },
            async "rename-channel"() {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                const channelId = interaction.options.getString("channel", true);
                const channel = interaction.client.channels.cache.get(channelId) as TextChannel | undefined;

                if (!channel || !new RegExp(serverAcro).test(channel.name)) return await interaction.reply("You need to select a channel from the list provided!");

                const farmNumber = channel.name.match(/\d/)![0];
                const role = interaction.client.mainGuild().roles.cache.get(serverObj.roles.farms[farmNumber])!;
                const farmName = role.name.slice(role.name.indexOf("(") + 1, -1);

                await channel.setName(`${channel.name.slice(0, channel.name.indexOf("-"))}-${farmName}`);

                await interaction.reply(`${channel} name successfully updated`);
            },
            async archive() {
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
            },
            async apply() {
                if (!interaction.member.roles.cache.hasAny(...serverObj.managerRoles)) return await youNeedRole(interaction, "mpManager");

                await interaction.reply(serverObj.form);
            }
        }, interaction.options.getSubcommand());
    },
    data: cmdBuilderData
});