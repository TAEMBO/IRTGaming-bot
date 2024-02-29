import { codeBlock, EmbedBuilder, Events } from "discord.js";
import { Event } from "../structures/index.js";

export default new Event({
    name: Events.MessageBulkDelete,
    async run(messages, channel) {
        if (!channel.client.config.toggles.logs) return;

        await channel.client.getChan("botLogs").send({ embeds: [new EmbedBuilder()
            .setTitle(`${messages.size} messages were deleted`)
            .setDescription(codeBlock("ansi", messages
                .map(msg => `[33m${msg.author?.username}:[37m ${msg.content}`)
                .reverse()
                .join("\n")
                .slice(0, 3900)
            ))
            .addFields({ name: "🔹 Channel", value: channel.toString() })
            .setColor(channel.client.config.EMBED_COLOR_RED)
            .setTimestamp()
        ] });
    }
});