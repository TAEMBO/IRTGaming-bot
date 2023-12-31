import { SlashCommandBuilder, AutocompleteInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { hasRole, onMFFarms, youNeedRole } from '../../utils.js';
import { Index, MFFarmRoleKeys, TInteraction } from '../../typings.js';

export default {
    async autocomplete(interaction: AutocompleteInteraction<"cached">) {
        await ({
            async member() {
                const displayedRoles = (() => {
                    if (hasRole(interaction.member, 'mpmanager') || hasRole(interaction.member, 'mfmanager')) {
                        return interaction.client.config.mainServer.mfFarmRoles.map(x => interaction.client.getRole(x));
                    } else if (hasRole(interaction.member, 'mffarmowner')) {
                        return interaction.client.config.mainServer.mfFarmRoles.map(x => interaction.client.getRole(x)).filter(x => onMFFarms(interaction.member).some(y => x.id === y));
                    } else {
                        return [];
                    }
                })();

                await interaction.respond(displayedRoles.map(({ name, id }) => ({ name, value: id })));
            },
            async rename() {
                const displayedRoles = (() => {
                    if (!hasRole(interaction.member, "mpmanager") && !hasRole(interaction.member, "mfmanager")) {
                        return [];
                    } else {
                        return interaction.client.config.mainServer.mfFarmRoles.map(x => ({ name: interaction.client.getRole(x).name, value: x }));
                    }
                })();

                await interaction.respond(displayedRoles);
            }
        } as Index)[interaction.options.getSubcommand()]();
    },
	async run(interaction: TInteraction) {
        await ({
            async member() {
                if (!hasRole(interaction.member, 'mpmanager') && !hasRole(interaction.member, 'mfmanager') && !hasRole(interaction.member, 'mffarmowner')) return await youNeedRole(interaction, "mffarmowner");

                const member = interaction.options.getMember("member");
                const roleId = interaction.options.getString("role", true);
                const validFarmIds = interaction.client.config.mainServer.mfFarmRoles.map(x => interaction.client.config.mainServer.roles[x]);

                if (!validFarmIds.includes(roleId)) return await interaction.reply("You need to select a valid MF Farm role from the list provided!");

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (member.roles.cache.has(roleId)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${roleId}> role, do you want to remove it from them?`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                        fetchReply: true, 
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel("Confirm"),
                            new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel("Cancel")
                        )]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 30_000,
                        componentType: ComponentType.Button
                    }).on('collect', async int => {
                        await ({
                            async yes() {
                                const rolesToRemove = onMFFarms(member).length === 1 ? [roleId, interaction.client.config.mainServer.roles.mfmember] : [roleId];
                                
                                await member.roles.remove(rolesToRemove);

                                await int.update({
                                    embeds: [new EmbedBuilder()
                                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been removed from the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${roleId}> roles.`)
                                        .setColor(interaction.client.config.EMBED_COLOR)
                                    ],
                                    components: []
                                });
                            },
                            async no() {
                                await int.update({ embeds: [new EmbedBuilder().setDescription('Command canceled').setColor(interaction.client.config.EMBED_COLOR)], components: [] });
                            }
                        } as Index)[int.customId]();
                    });
                } else {
                    await member.roles.add([roleId, interaction.client.config.mainServer.roles.mfmember]);

                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been given the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${roleId}> roles.`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            },
            async owner() {
                if (!hasRole(interaction.member, "mpmanager") && !hasRole(interaction.member, "mfmanager")) return await youNeedRole(interaction, "mpmanager");

                const member = interaction.options.getMember('member');

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (member.roles.cache.has(interaction.client.config.mainServer.roles.mffarmowner)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role, do you want to remove it from them?`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel('Confirm'),
                            new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel('Cancel')
                        )]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 30_000,
                        componentType: ComponentType.Button
                    }).on('collect', async int => {
                        await ({
                            async yes() {
                                await member.roles.remove(interaction.client.config.mainServer.roles.mffarmowner);

                                await int.update({
                                    embeds: [new EmbedBuilder()
                                        .setDescription(`${member} (${member.user.tag}) has been removed from the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role`)
                                        .setColor(interaction.client.config.EMBED_COLOR)
                                    ],
                                    components: []
                                });

                            },
                            async no() {
                                await int.update({ embeds: [new EmbedBuilder().setDescription('Command canceled').setColor(interaction.client.config.EMBED_COLOR)], components: [] });
                            }
                        } as Index)[int.customId]();
                    });
                } else {
                    await member.roles.add(interaction.client.config.mainServer.roles.mffarmowner);

                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been given the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            },
            async rename() {
                const roleKey = interaction.options.getString("role", true);

                if (!((role: string): role is MFFarmRoleKeys => {
                    return interaction.client.config.mainServer.mfFarmRoles.includes(role as MFFarmRoleKeys);
                })(roleKey)) return await interaction.reply("You need to select a valid MF Farm role from the list provided!");

                const role = interaction.client.getRole(roleKey);
                const name = interaction.options.getString("name", false);
                const roleNamePrefix = role.name.split(" ").slice(0, 3).join(" ");

                if (name) {
                    await role.setName(`${roleNamePrefix} (${name})`);
                } else {
                    await role.setName(roleNamePrefix);
                }

                await interaction.reply(`${roleNamePrefix} role name set to \`${role.name}\``);
            },
            async apply() {
                if (!hasRole(interaction.member, "mpmanager") && !hasRole(interaction.member, "mfmanager")) return await youNeedRole(interaction, "mpmanager");

                await interaction.reply(interaction.client.config.resources.mfFarmOwnerForm);
            }
        } as Index)[interaction.options.getSubcommand()]();
	},
    data: new SlashCommandBuilder()
        .setName('mf')
        .setDescription('MF management')
        .addSubcommand(x => x
            .setName('member')
            .setDescription('Manage MF farm members')
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
            .setName('owner')
            .setDescription('Manage MF farm owners')
            .addUserOption(x => x
                .setName('member')
                .setDescription('The member to add or remove the MF Farm Owner role from')
                .setRequired(true)))
        .addSubcommand(x => x
            .setName("rename")
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
            .setName("apply")
            .setDescription("Send the Google Form to apply to be an MF Farm Owner"))
};