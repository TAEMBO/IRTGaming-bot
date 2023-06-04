import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const user = interaction.options.getUser("member", true);
        interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());
        interaction.channel?.send(`<@${user.id}> has received an honorary ban!`);
    },
    data: new SlashCommandBuilder()
        .setName("band")
        .setDescription("Introduce an honorary ban")
        .addUserOption(x=>x
            .setName("member")
            .setDescription("It's an honor")
            .setRequired(true))
};
