import { SlashCommandBuilder, ChannelType, TextChannel } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		const channel = interaction.options.getChannel('channel') as TextChannel ?? interaction.channel;
        
        channel.sendTyping();
        interaction.reply({ content: `Sent typing status to <#${channel.id}>`, ephemeral: true });
	},
	data: new SlashCommandBuilder()
		.setName("typing")
		.setDescription("BOT TYPING???????? HOW IT DO DAT!!!!!")
        .addChannelOption(x=>x
            .setName('channel')
            .setDescription('Optional channel to troll')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false))
};
