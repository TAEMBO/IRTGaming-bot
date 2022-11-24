import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		client.punish(client, interaction, 'mute');
	},
	data: new SlashCommandBuilder()
		.setName("mute")
		.setDescription("Mute a member")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member to mute")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("time")
			.setDescription("The time for the mute")
			.setRequired(false))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for muting the member")
			.setRequired(false))
};
