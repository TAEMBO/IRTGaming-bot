import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const msg = await interaction.reply({ content: "Pinging...", fetchReply: true });

        await interaction.editReply([
            `Websocket: \`${interaction.client.ws.ping}\`ms`,
            `Round-trip: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms`
        ].join("\n"));
    },
    data: {
        name: "ping",
        description: "Check the bot's latency"
    }
});
