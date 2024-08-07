import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const word = interaction.options.getString("word", true);

        if (!interaction.client.bannedWords.cache.includes(word)) {
            await interaction.client.bannedWords.add(word);

            await interaction.reply("Successfully added to bannedWords list");
        } else await interaction.reply("That word is already added");
    },
    data: new SlashCommandBuilder()
        .setName("addbannedword")
        .setDescription("Add a word to the bannedWords list")
        .addStringOption(x => x
            .setName("word")
            .setDescription("The word to add")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
});
