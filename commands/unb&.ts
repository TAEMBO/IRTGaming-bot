import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
        const user = interaction.options.getUser("member", true);
        interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());
        interaction.channel?.send(`<@${user.id}> had their honorary ban revoked!`);
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revoke an honorary ban")
        .addUserOption(x=>x
            .setName("member")
            .setDescription("It's an honor")
            .setRequired(true))
};
