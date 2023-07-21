import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		interaction.client.punish(interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("softban")
		.setDescription("Ban a member, delete their messages from the last 7 days and unban them")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to softban")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for softbanning this member")
			.setRequired(false))
};
