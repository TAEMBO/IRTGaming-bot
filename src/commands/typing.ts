import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		const channel = interaction.options.getChannel('channel', false, [ChannelType.GuildText]) ?? interaction.channel;

        if (!channel) return await interaction.reply({ content: 'No channel found', ephemeral: true });
        
        await channel.sendTyping();
        await interaction.reply({ content: `Sent typing status to <#${channel.id}>`, ephemeral: true });
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
