import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { punish } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		punish(client, interaction, this.data.name);
	},
	data: new SlashCommandBuilder()
		.setName("warn")
		.setDescription("Warn a member")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to warn")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for warning the member")
			.setRequired(false))
};
