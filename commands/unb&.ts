import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const user = interaction.options.getUser("member", true);
        interaction.reply({ ephemeral: true }).then(() => interaction.deleteReply());
        interaction.channel?.send(`<@${user.id}> had their honorary ban revoked!`);
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revokes an honorary ban")
        .addUserOption((opt)=>opt
            .setName("member")
            .setDescription("It's an honor")
            .setRequired(true))
};
