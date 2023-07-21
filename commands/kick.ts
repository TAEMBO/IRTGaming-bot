import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		interaction.client.punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Kick a member")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to kick")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for kicking the member")
			.setRequired(false))
};
