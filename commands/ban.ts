import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		client.punish(interaction, 'ban');
	},
    data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Ban a member")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to ban")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("time")
			.setDescription("The time for the ban")
			.setRequired(false))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for banning the member")
			.setRequired(false))
};
