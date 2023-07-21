import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, messages: Discord.Collection<string, Discord.Message<boolean>>, channel: Discord.GuildTextBasedChannel) => {
    if (!client.config.botSwitches.logs) return;

    client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTitle(`${messages.size} messages were deleted`)
        .setDescription(`\`\`\`ansi\n${messages.map(msg => `[33m${msg.author.username}:[37m ${msg.content}`).reverse().join('\n').slice(0, 3900)}\`\`\``)
        .addFields({ name: '🔹 Channel', value: channel.toString() })
        .setColor(client.config.embedColor)
        .setTimestamp()
    ] });
}
