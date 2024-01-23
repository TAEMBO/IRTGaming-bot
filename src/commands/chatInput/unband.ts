import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
        const user = interaction.options.getUser("member", true);

        await interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());
        await interaction.channel?.send(`<@${user.id}> had their honorary ban revoked!`);
    },
    data: new SlashCommandBuilder()
        .setName("unband")
        .setDescription("Revoke an honorary ban")
        .addUserOption(x => x
            .setName("member")
            .setDescription("It's an honor")
            .setRequired(true))
};
