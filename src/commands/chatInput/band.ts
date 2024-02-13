import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../utils.js";

export default new Command<"chatInput">({
    async run(interaction) {
        const user = interaction.options.getUser("member", true);

        await interaction.deferReply({ ephemeral: true }).then(() => interaction.deleteReply());
        await interaction.channel!.send(`<@${user.id}> has received an honorary ban!`);
    },
    data: new SlashCommandBuilder()
        .setName("band")
        .setDescription("Introduce an honorary ban")
        .addUserOption(x => x
            .setName("member")
            .setDescription("It's an honor")
            .setRequired(true))
});
