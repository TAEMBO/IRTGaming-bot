import { memoryUsage } from "node:process";
import { Command } from "#structures";
import { formatTime } from "#util";

function formatBytes(bytes: number) {
    if (!bytes) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1_000));

    return (bytes / Math.pow(1_000, i)).toFixed(1) + " " + sizes[i];
}

export default new Command<"chatInput">({
    async run(interaction) {
        const msg = await interaction.deferReply({ fetchReply: true });
        const { heapUsed, heapTotal, rss } = memoryUsage();

        await interaction.editReply(
            `Websocket: \`${interaction.client.ws.ping}\`ms\n` +
            `Round-trip: \`${msg.createdTimestamp - interaction.createdTimestamp}\`ms\n` +
            `-# Memory: ${formatBytes(heapUsed)} **|** ${formatBytes(heapTotal)} **|** ${formatBytes(rss)}\n` +
            `-# Uptime: ${formatTime(interaction.client.uptime, 2, { longNames: true })}`
        );
    },
    data: {
        name: "ping",
        description: "Check the bot's latency"
    }
});
