import Discord, { SlashCommandBuilder, ChannelType } from 'discord.js';
import YClient from '../client.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if (!channel || channel.type === ChannelType.GuildCategory || channel.type === ChannelType.GuildForum) return interaction.reply({ content: 'Invalid channel', ephemeral: true });
        
        channel.sendTyping();
        interaction.reply({ content: `Sent typing status to <#${channel.id}>`, ephemeral: true });
	},
	data: new SlashCommandBuilder()
		.setName("typing")
		.setDescription("BOT TYPING???????? HOW IT DO DAT!!!!!")
        .addChannelOption(x=>x
            .setName('channel')
            .setDescription('Optional channel to troll')
            .setRequired(false))
};
