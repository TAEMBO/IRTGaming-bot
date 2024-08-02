import { SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const msg = await interaction.reply({ content: "Pinging...", fetchReply: true });

        await interaction.editReply([
            `Websocket: \`${interaction.client.ws.ping}\`ms`,
            `Round-trip: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`
        ].join("\n"));
    },
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency")
});
