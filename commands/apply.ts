import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const applicationLogs = client.channels.resolve('811341461223112714') as Discord.TextChannel;
        const userData = await client.userLevels._content.findById(interaction.user.id);
        const eligibleTime = (Date.now() - (interaction.member.joinedTimestamp as number)) > 1209600000;
        const eligibleMsgs = userData?.level ? userData.level > 3 : false;
        const deniedMsgs: Array<string> = [];

        if (!eligibleTime) deniedMsgs.push('be on the Discord server for at least two weeks');
        if (!eligibleMsgs) deniedMsgs.push('be more active on the Discord server');

        if (deniedMsgs.length == 0) {
            interaction.reply({content: 'https://forms.gle/JivS14vJgcJCKigq7', ephemeral: true});
            applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) opened an MP Staff application at <t:${Math.round(Date.now() / 1000)}>\nForm: <https://forms.gle/JivS14vJgcJCKigq7>`);
        } else {
            interaction.reply({content: `You need to ${deniedMsgs.join(' and ')} before applying`, ephemeral: true});
            applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) tried to open an MP Staff application but was rejected`);
        }
    },
    data: new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Apply for MP Staff")
};