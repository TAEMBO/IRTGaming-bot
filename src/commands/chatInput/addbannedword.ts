import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const word = interaction.options.getString("word", true);

        if (interaction.client.bannedWords.cache.includes(word)) return await interaction.reply("That word is already added");

        await interaction.client.bannedWords.add(word);

        await interaction.reply("Successfully added to bannedWords list");
    },
    data: {
        name: "addbannedword",
        description: "Add a word to the bannedWords list",
        default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "word",
                description: "The word to add",
                required: true
            }
        ]
    }
});
