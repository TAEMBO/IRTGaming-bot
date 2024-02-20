import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/index.js";

export default new Command<"chatInput">({
    async run(interaction) {
        const time = interaction.options.getInteger("time", true);

        await interaction.channel!.setRateLimitPerUser(time, `Done by ${interaction.user.tag}`);

        if (!time) {
            await interaction.reply("Slowmode removed.");
        } else await interaction.reply(`Slowmode set to \`${time}\` ${time === 1 ? "second" : "seconds"}.`);
    },
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets the slowmode to the provided amount.")
        .addIntegerOption(x => x
            .setName("time")
            .setDescription("The time amount for the slowmode")
            .setRequired(true)
            .setMaxValue(21600))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
});