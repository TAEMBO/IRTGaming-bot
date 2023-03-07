import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (interaction.channel?.type === Discord.ChannelType.GuildStageVoice) return;
        const user = interaction.options.getUser("user", true);
        interaction.reply({content: "ok", ephemeral: true});
        interaction.channel?.send({content: `<@${user.id}> had their honorary ban revoked!`});
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revokes an honorary ban.")
        .addUserOption((opt)=>opt
            .setName("user")
            .setDescription("It's an honor")
            .setRequired(true))
};
