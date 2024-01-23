import { type ChatInputCommandInteraction, EmbedBuilder, ThreadAutoArchiveDuration, SlashCommandBuilder } from "discord.js";

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
        const suggestion = interaction.options.getString("suggestion", true);

        if (interaction.channelId !== interaction.client.config.mainServer.channels.communityIdeas) return await interaction.reply({ content: `This command only works in <#${interaction.client.config.mainServer.channels.communityIdeas}>`, ephemeral: true });

        const msg = await interaction.reply({ embeds: [new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName} (${interaction.user.id})`, iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 128 }) })
            .setTitle("Community Idea")
            .setDescription(suggestion)
            .setTimestamp()
            .setColor(interaction.client.config.EMBED_COLOR)
        ], fetchReply: true });

        await msg.react('✅');
        await msg.react('❌');
        await msg.startThread({
            name: `Discussion of ${interaction.member.displayName}'s Community Idea`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
    },
    data: new SlashCommandBuilder()
        .setName("suggest")
        .setDescription("Create a suggestion")
        .addStringOption(x => x
            .setName("suggestion")
            .setDescription("Your suggestion")
            .setRequired(true))
};