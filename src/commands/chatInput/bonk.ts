import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const member = interaction.options.getMember("member");
        let reason = interaction.options.getString("reason", false);

        if (!member) return await interaction.reply({ content: "You cannot bonk someone who's not in the server!", ephemeral: true });
        if (reason?.startsWith("for ")) reason = reason.replace("for ", "");

        await interaction.reply({ embeds: [new EmbedBuilder()
            .setColor(interaction.client.config.EMBED_COLOR)
            .setTitle([
                interaction.user.username,
                " bonked ",
                interaction.user.id === member.id ? "themselves" : member.user.username,
                "\nfor ",
                reason ?? "no reason",
                "!"
            ].join(""))
            .setThumbnail(interaction.client.config.resources.bonkEmbedThumbnail)
        ] });
    },
    data: {
        name: "bonk",
        description: "Bonk someone",
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "member",
                description: "The member to bonk",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "The reason for bonking the member",
                required: false
            }
        ]
    }
});
