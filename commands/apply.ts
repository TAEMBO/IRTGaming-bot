import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { getChan } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const applicationLogs = getChan(client, 'mpApplicationLogs');
        const userData = await client.userLevels._content.findById(interaction.user.id);
        const eligibleTime = (Date.now() - (interaction.member.joinedTimestamp as number)) > (1000 * 60 * 60 * 24 * 14);
        const eligibleMsgs = userData?.level ? userData.level > 3 : false;
        const deniedMsgs: string[] = [];

        if (!eligibleTime) deniedMsgs.push('be on the Discord server for at least two weeks');
        if (!eligibleMsgs) deniedMsgs.push('be more active on the Discord server');

        if (!deniedMsgs.length) {
            interaction.reply({ content: 'https://forms.gle/o1oM1vHdJe6RCmJ39', ephemeral: true });
            applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) opened an MP Staff application on <t:${Math.round(Date.now() / 1000)}>`);
        } else {
            interaction.reply({ content: `You need to ${deniedMsgs.join(' and ')} before applying`, ephemeral: true });
            applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) tried to open an MP Staff application but was rejected (**${deniedMsgs.join('** and **')}**)`);
        }
    },
    data: new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Apply for MP Staff")
};
