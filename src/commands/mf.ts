import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { hasRole, onMFFarms, youNeedRole } from '../utilities.js';
import { Index, TInteraction } from '../typings.js';


export default {
	async run(interaction: TInteraction) {
        await ({
            async farms() {
                if (!hasRole(interaction.member, 'mpmanager') && !hasRole(interaction.member, 'mfmanager') && !hasRole(interaction.member, 'mffarmowner')) return await youNeedRole(interaction, "mffarmowner");

                const member = interaction.options.getMember("member");
                const Role = interaction.client.config.mainServer.roles[interaction.options.getString("role", true) as keyof typeof interaction.client.config.mainServer.roles];
        

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (member.roles.cache.has(Role)) {
                    if (!hasRole(interaction.member, 'mfmanager') && hasRole(interaction.member, 'mffarmowner') && !interaction.member.roles.cache.has(Role)) return await interaction.reply('You cannot remove users from a farm you do not own.');
                    
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${Role}> role, do you want to remove it from them?`)
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
                                const rolesToRemove = onMFFarms(member).length === 1 ? [Role, interaction.client.config.mainServer.roles.mfmember] : [Role];
                                
                                await member.roles.remove(rolesToRemove);
                                await int.update({
                                    embeds: [new EmbedBuilder()
                                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been removed from the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`)
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
                    if (hasRole(interaction.member, 'mffarmowner') && !hasRole(interaction.member, 'mfmanager') && !interaction.member.roles.cache.has(Role)) return await interaction.reply('You cannot add users to a farm you do not own.');
        
                    await member.roles.add([Role, interaction.client.config.mainServer.roles.mfmember]);
                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been given the <@&${interaction.client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            },
            async owners() {
                const member = interaction.options.getMember('member');

                if (!member) return await interaction.reply({ content: 'You need to select a member that\'s in this server', ephemeral: true });

                if (!onMFFarms(member).length) return await interaction.reply({ content: 'The chosen member needs to be on at least one MF farm', ephemeral: true });

                if (member.roles.cache.has(interaction.client.config.mainServer.roles.mffarmowner)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription(`This member already has the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role, do you want to remove it from them?`)
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                        ephemeral: true,
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

                                await int.update({ embeds: [new EmbedBuilder()
                                    .setDescription(`<#${member.user.id}> (${member.user.tag}) has been removed from the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role`)
                                    .setColor(interaction.client.config.EMBED_COLOR)
                                ] });

                            },
                            async no() {
                                await int.update({ embeds: [new EmbedBuilder().setDescription('Command canceled').setColor(interaction.client.config.EMBED_COLOR)], components: [] });
                            }
                        } as Index)[int.customId]();
                    })
                } else {
                    await member.roles.add(interaction.client.config.mainServer.roles.mffarmowner);
                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription(`<@${member.user.id}> (${member.user.tag}) has been given the <@&${interaction.client.config.mainServer.roles.mffarmowner}> role`)
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            }
        } as Index)[interaction.options.getSubcommand()]();
	},
    data: new SlashCommandBuilder()
        .setName('mf')
        .setDescription('MF management')
        .addSubcommand(x => x
            .setName('farms')
            .setDescription('Manage MF farm members')
            .addUserOption(x => x
                .setName("member")
                .setDescription("The member to add or remove a role from")
                .setRequired(true))
            .addStringOption(x => x
                .setName("role")
                .setDescription("the role to add or remove")
                .addChoices(
                    { name: 'Farm 1', value: 'mffarm1' },
                    { name: 'Farm 2', value: 'mffarm2' },
                    { name: 'Farm 3', value: 'mffarm3' },
                    { name: 'Farm 4', value: 'mffarm4' },
                    { name: 'Farm 5', value: 'mffarm5' },
                    { name: 'Farm 6', value: 'mffarm6' },
                    { name: 'Farm 7', value: 'mffarm7' },
                    { name: 'Farm 8', value: 'mffarm8' },
                    { name: 'Farm 9', value: 'mffarm9' },
                    { name: 'Farm 10', value: 'mffarm10' })
                .setRequired(true)))
        .addSubcommand(x => x
            .setName('owners')
            .setDescription('Manage MF farm owners')
            .addUserOption(x => x
                .setName('member')
                .setDescription('The member to add or remove the MF Farm Owner role from')
                .setRequired(true)))
};