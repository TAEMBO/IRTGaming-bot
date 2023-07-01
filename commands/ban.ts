import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { punish } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		punish(client, interaction, this.data.name);
	},
    data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Ban a member")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to ban")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("time")
			.setDescription("The time for the ban")
			.setRequired(false))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for banning the member")
			.setRequired(false))
};
