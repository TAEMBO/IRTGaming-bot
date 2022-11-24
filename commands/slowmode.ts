import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if(!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
        const time = interaction.options.getInteger("time") as number;
        
        if (time > 21600) return interaction.reply('The slowmode limit is 6 hours (\`21600\` seconds).');
        (interaction.channel as Discord.TextChannel).setRateLimitPerUser(time, `Done by ${interaction.user.tag}`)
        if (time === 0) {
            interaction.reply('Slowmode removed.')
        } else return interaction.reply(`Slowmode set to \`${time}\` ${time === 1 ? 'second' : 'seconds'}.`)
	},
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets the slowmode to the provided amount.")
        .addIntegerOption((opt)=>opt
            .setName("time")
            .setDescription("The time amount for the slowmode")
            .setRequired(true))
};