import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
		const word = interaction.options.getString("word", true);

		if (!interaction.client.bannedWords.data.includes(word)) {
			interaction.client.bannedWords.add(word);

			await interaction.reply('Successfully added to bannedWords list');
		} else await interaction.reply('That word is already added');
	},
	data: new SlashCommandBuilder()
		.setName("addbannedword")
		.setDescription("Add a word to the bannedWords database")
		.addStringOption(x => x
			.setName("word")
			.setDescription("The word to add")
			.setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
};
