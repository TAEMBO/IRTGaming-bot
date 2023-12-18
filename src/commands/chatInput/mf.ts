import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { hasRole, onMFFarms, youNeedRole } from '../../utilities.js';
import { Index, TInteraction } from '../../typings.js';

export default {
	async run(interaction: TInteraction) {
        await ({
            async member() {
                if (!hasRole(interaction.member, 'mpmanager') && !hasRole(interaction.member, 'mfmanager') && !hasRole(interaction.member, 'mffarmowner')) return await youNeedRole(interaction, "mffarmowner");

                const member = interaction.options.getMember("member");
                const farmRole = interaction.options.getString("role", true);

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (member.roles.cache.has(farmRole)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${farmRole}> role, do you want to remove it from them?`)
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
                                const rolesToRemove = onMFFarms(member).length === 1 ? [farmRole, interaction.client.config.mainServer.roles.mfmember] : [farmRole];
                                
                                await member.roles.remove(rolesToRemove);

                                await int.update({
                                    embeds: [new EmbedBuilder()
                                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been removed from the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${farmRole}> roles.`)
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
                    await member.roles.add([farmRole, interaction.client.config.mainServer.roles.mfmember]);

                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been given the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${farmRole}> roles.`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            },
            async owner() {
                if (!hasRole(interaction.member, "mpmanager") && !hasRole(interaction.member, "mfmanager")) return await youNeedRole(interaction, "mpmanager");

                const member = interaction.options.getMember('member');

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (!onMFFarms(member).length) return await interaction.reply({ content: 'The chosen member needs to be on at least one MF farm', ephemeral: true });

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
                const role = interaction.client.getRole(interaction.options.getString("role", true) as keyof typeof interaction.client.config.mainServer.roles);
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