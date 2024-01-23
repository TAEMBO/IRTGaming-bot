import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
        const applicationLogs = interaction.client.getChan('mpApplicationLogs');
        const userData = await interaction.client.userLevels.data.findById(interaction.user.id);
        const eligibleTime = (Date.now() - (interaction.member.joinedTimestamp as number)) > (1000 * 60 * 60 * 24 * 14);
        const eligibleMsgs = userData?.level ? userData.level > 3 : false;
        const deniedMsgs: string[] = [];

        if (!eligibleTime) deniedMsgs.push('be on the Discord server for at least two weeks');
        if (!eligibleMsgs) deniedMsgs.push('be more active on the Discord server');

        if (!deniedMsgs.length) {
            await interaction.reply({ content: interaction.client.config.resources.applyGoogleForm, ephemeral: true });
            await applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) opened an MP Staff application on <t:${Math.round(Date.now() / 1000)}>`);
        } else {
            await interaction.reply({ content: `You need to ${deniedMsgs.join(' and ')} before applying`, ephemeral: true });
            await applicationLogs.send(`<@${interaction.user.id}> (${interaction.user.tag}) tried to open an MP Staff application but was rejected (**${deniedMsgs.join('** and **')}**)`);
        }
    },
    data: new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Apply for MP Staff")
};
