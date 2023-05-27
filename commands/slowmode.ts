import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if(!client.isDCStaff(interaction.member)) return client.youNeedRole(interaction, 'discordmoderator');
        const time = interaction.options.getInteger("time", true);
        
        if (time > 21600) return interaction.reply('The slowmode limit is 6 hours (\`21600\` seconds).');
        interaction.channel?.setRateLimitPerUser(time, `Done by ${interaction.user.tag}`)
        if (time === 0) {
            interaction.reply('Slowmode removed.')
        } else interaction.reply(`Slowmode set to \`${time}\` ${time === 1 ? 'second' : 'seconds'}.`)
	},
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets the slowmode to the provided amount.")
        .addIntegerOption(x=>x
            .setName("time")
            .setDescription("The time amount for the slowmode")
            .setRequired(true))
};