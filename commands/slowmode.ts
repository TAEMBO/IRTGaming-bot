import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { isDCStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        const time = interaction.options.getInteger("time", true);

        if (!isDCStaff(interaction)) return await youNeedRole(interaction, 'discordmoderator');
        if (time > 21600) return await interaction.reply('The slowmode limit is 6 hours (\`21600\` seconds).');

        await interaction.channel?.setRateLimitPerUser(time, `Done by ${interaction.user.tag}`);

        if (!time) {
            await interaction.reply('Slowmode removed.');
        } else await interaction.reply(`Slowmode set to \`${time}\` ${time === 1 ? 'second' : 'seconds'}.`);
	},
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets the slowmode to the provided amount.")
        .addIntegerOption(x => x
            .setName("time")
            .setDescription("The time amount for the slowmode")
            .setRequired(true))
};