import { EmbedBuilder, Collection, Message, GuildTextBasedChannel } from 'discord.js';
import { TClient } from '../typings.js';

export default async (messages: Collection<string, TClient<Message<boolean>>>, channel: TClient<GuildTextBasedChannel>) => {
    if (!channel.client.config.botSwitches.logs) return;

    await channel.client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTitle(`${messages.size} messages were deleted`)
        .setDescription(`\`\`\`ansi\n${messages.map(msg => `[33m${msg.author.username}:[37m ${msg.content}`).reverse().join('\n').slice(0, 3900)}\`\`\``)
        .addFields({ name: '🔹 Channel', value: channel.toString() })
        .setColor(channel.client.config.embedColor)
        .setTimestamp()
    ] });
}
