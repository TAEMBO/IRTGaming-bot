import { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "#structures";
<<<<<<< HEAD
=======
import { getEmbedColor, getConfigResource } from "#util";
>>>>>>> e0ae159 (clean: config validation + crash fixes)

export default new Command<"chatInput">({
    async run(interaction) {
        const member = interaction.options.getMember("member");
        let reason = interaction.options.getString("reason", false);

        if (!member) return await interaction.reply({ content: "You cannot bonk someone who's not in the server!", flags: MessageFlags.Ephemeral });
        if (reason?.startsWith("for ")) reason = reason.replace("for ", "");

<<<<<<< HEAD
        await interaction.reply({ embeds: [new EmbedBuilder()
            .setColor(interaction.client.config.EMBED_COLOR)
=======
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor(interaction.client))
>>>>>>> e0ae159 (clean: config validation + crash fixes)
            .setTitle([
                interaction.user.username,
                " bonked ",
                interaction.user.id === member.id ? "themselves" : member.user.username,
                "\nfor ",
                reason ?? "no reason",
                "!"
<<<<<<< HEAD
            ].join(""))
            .setThumbnail(interaction.client.config.resources.bonkEmbedThumbnail)
        ] });
=======
            ].join(""));
        const thumbnail = getConfigResource(interaction.client, "bonkEmbedThumbnail");

        if (thumbnail) embed.setThumbnail(thumbnail);

        await interaction.reply({ embeds: [embed] });
>>>>>>> e0ae159 (clean: config validation + crash fixes)
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
