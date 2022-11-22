import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		client.punish(client, interaction, 'softban');
	},
	data: new SlashCommandBuilder()
		.setName("softban")
		.setDescription("Ban a member, delete their messages from the last 7 days and unban them")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to softban")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for softbanning this member")
			.setRequired(false))
};
