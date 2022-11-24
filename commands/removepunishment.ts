import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		client.unPunish(client, interaction);
	},
	data: new SlashCommandBuilder()
		.setName("unpunish")
		.setDescription("Unpunish a member")
		.addIntegerOption((opt) => opt
			.setName("case_id")
			.setDescription("The ID of the punishment to remove")
			.setRequired(true))
		.addStringOption((opt)=>opt
			.setName("reason")
			.setDescription("The reason for removing the punishment")
			.setRequired(false))
};