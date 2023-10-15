import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
		if (!isDCStaff(interaction.member) && !interaction.client.config.devWhitelist.includes(interaction.member.id)) return await youNeedRole(interaction, 'discordmoderator');
        
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
};
