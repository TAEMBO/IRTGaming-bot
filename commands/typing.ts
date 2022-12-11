import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const channel = interaction.options.getChannel('channel') as Discord.TextChannel?? interaction.channel;
        channel.sendTyping();
        interaction.reply({content: `Sent typing status to <#${channel.id}>`, ephemeral: true});
	},
	data: new SlashCommandBuilder()
		.setName("typing")
		.setDescription("BOT TYPING???????? HOW IT DO DAT!!!!!")
        .addChannelOption(opt=>opt
            .setName('channel')
            .setDescription('Optional channel to troll')
            .setRequired(false))
};
