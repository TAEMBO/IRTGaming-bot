import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		client.punish(interaction, this.data.name);
	},
    data: new SlashCommandBuilder()
		.setName("detain")
		.setDescription("Give a member the \"Detained\" role")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member to detain")
			.setRequired(true))
		.addStringOption(x=>x
			.setName("reason")
			.setDescription("The reason for detaining the member")
			.setRequired(false))
};
