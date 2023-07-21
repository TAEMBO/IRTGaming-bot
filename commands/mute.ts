import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		interaction.client.punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("mute")
		.setDescription("Mute a member")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to mute")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("time")
			.setDescription("The time for the mute")
			.setRequired(false))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for muting the member")
			.setRequired(false))
};
