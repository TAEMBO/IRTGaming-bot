import { ApplicationCommandOptionType, channelMention, EmbedBuilder, ThreadAutoArchiveDuration } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const suggestion = interaction.options.getString("suggestion", true);
        const { communityIdeas } = interaction.client.config.mainServer.channels;

        if (interaction.channelId !== communityIdeas) {
            return interaction.reply({ content: "This command only works in " + channelMention(communityIdeas), ephemeral: true });
        }

        const msg = await interaction.reply({ embeds: [new EmbedBuilder()
            .setAuthor({
                name: `${interaction.member.displayName} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL({ extension: "png", size: 128 })
            })
            .setTitle("Community Idea")
            .setDescription(suggestion)
            .setTimestamp()
            .setColor(interaction.client.config.EMBED_COLOR)
        ], fetchReply: true });

        await msg.react("✅");
        await msg.react("❌");
        await msg.startThread({
            name: `Discussion of ${interaction.member.displayName}'s Community Idea`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
    },
    data: {
        name: "suggest",
        description: "Create a suggestion",
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "suggestion",
                description: "Your suggestion",
                required: true
            }
        ]
    }
});
