import Discord, { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.isMPStaff(interaction.member)) return;
        interaction.reply({components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId(`mpReport`).setLabel("MP Report test"))
        ]});
	},
	data: new SlashCommandBuilder()
		.setName("report")
		.setDescription("TESTING TESTING 123 WAKEY WAKEY")
};
