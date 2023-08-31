import Discord, { EmbedBuilder } from 'discord.js';
import { TClient } from '../typings.js';

export default async (messages: TClient<Discord.Collection<string, Discord.Message<boolean>>>, channel: TClient<Discord.GuildTextBasedChannel>) => {
    if (!channel.client.config.botSwitches.logs) return;

    channel.client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTitle(`${messages.size} messages were deleted`)
        .setDescription(`\`\`\`ansi\n${messages.map(msg => `[33m${msg.author.username}:[37m ${msg.content}`).reverse().join('\n').slice(0, 3900)}\`\`\``)
        .addFields({ name: '🔹 Channel', value: channel.toString() })
        .setColor(channel.client.config.embedColor)
        .setTimestamp()
    ] });
}
