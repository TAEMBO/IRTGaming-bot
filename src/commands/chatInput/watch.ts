import { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType } from 'discord.js';
import { Index } from '../../typings.js';
import { isMPStaff, youNeedRole } from '../../utils.js';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpstaff");

        await ({
            async add() {
                const reason = interaction.options.getString('reason', true);
                const name = interaction.options.getString('username', true);
                const severity = interaction.options.getString("severity", true) as "ban" | "watch";
                const wlData = await interaction.client.watchList.data.findById(name);

                if (!wlData) {
                    await interaction.client.watchList.data.create({ _id: name, reason, isSevere: severity === "ban" ? true : false });
                    await interaction.reply(`Successfully added \`${name}\` who needs to be **${severity === "ban" ? "banned" : "watched over"}** with reason \`${reason}\``);
                } else await interaction.reply(`\`${name}\` already exists for reason \`${wlData.reason}\``);
            },
            async remove() {
                const name = interaction.options.getString('username', true);
                const wlData = await interaction.client.watchList.data.findById(name);

                if (wlData) {
                    await interaction.client.watchList.data.findByIdAndDelete(name);
                    await interaction.reply(`Successfully removed \`${name}\` from watchList`);
                } else await interaction.reply(`\`${name}\` doesn't exist on watchList`);
            },
            async view() {
                await interaction.reply({ files: [new AttachmentBuilder(Buffer.from(JSON.stringify(await interaction.client.watchList.data.find(), null, 2)), { name: 'watchListCache.json' })] });
            },
            async subscription() {
                if (interaction.client.watchListPings.data.includes(interaction.user.id)) {
                    (await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription("You are already subscribed to watchList notifications, do you want to unsubscribe?")
                            .setColor(interaction.client.config.EMBED_COLOR)
                        ],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                            new ButtonBuilder().setCustomId('yes').setStyle(ButtonStyle.Success).setLabel('Yes'),
                            new ButtonBuilder().setCustomId('no').setStyle(ButtonStyle.Danger).setLabel('No')
                        )]
                    })).createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 30_000,
                        componentType: ComponentType.Button
                    }).on('collect', async int => {
                        await ({
                            async yes() {
                                interaction.client.watchListPings.remove(interaction.user.id);

                                await int.update({
                                    embeds: [new EmbedBuilder().setDescription("You have successfully unsubscribed from watchList notifications").setColor(interaction.client.config.EMBED_COLOR)],
                                    components: []
                                });

                            },
                            async no() {
                                await int.update({
                                    embeds: [new EmbedBuilder().setDescription('Command canceled').setColor(interaction.client.config.EMBED_COLOR)],
                                    components: []
                                });
                            }
                        } as Index)[int.customId]();
                    });
                } else {
                    interaction.client.watchListPings.add(interaction.user.id)

                    await interaction.reply({ embeds: [new EmbedBuilder()
                        .setDescription("You have successfully subscribed to watchList notifications")
                        .setFooter({ text: "Run this command again if this was a mistake" })
                        .setColor(interaction.client.config.EMBED_COLOR)
                    ] });
                }
            }
        } as Index)[interaction.options.getSubcommand()]();
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Manage watchList names")
        .addSubcommand(x => x
            .setName('add')
            .setDescription('add a player to watchList')
            .addStringOption(x => x
                .setName('username')
                .setDescription('The player name to add')
                .setRequired(true))
            .addStringOption(x=>x
                .setName('reason')
                .setDescription('The reason for adding the player')
                .setRequired(true))
            .addStringOption(x => x
                .setName("severity")
                .setDescription("Whether this player needs to be banned, or simply watched over")
                .addChoices(
                    { name: "Needs banning", value: "ban" },
                    { name: "Needs to be watched over", value: "watch" }
                )
                .setRequired(true)))
        .addSubcommand(x => x
            .setName('remove')
            .setDescription('remove a player from watchList')
            .addStringOption(x => x
                .setName('username')
                .setDescription('The player name to remove')
                .setRequired(true)))
        .addSubcommand(x => x
            .setName('view')
            .setDescription('View the full watchList'))
        .addSubcommand(x => x
            .setName("subscription")
            .setDescription("Manage your subscription to watchList notifications"))
};
