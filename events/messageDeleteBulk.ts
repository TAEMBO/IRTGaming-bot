import Discord from 'discord.js';
import YClient from '../client.js';
import { getChan } from '../utilities.js';

export default async (client: YClient, messages: Discord.Collection<string, Discord.Message<boolean>>, channel: Discord.GuildTextBasedChannel) => {
    if (!client.config.botSwitches.logs) return;

    getChan(client, 'botLogs').send({ embeds: [new client.embed()
        .setTitle(`${messages.size} messages were deleted`)
        .setDescription(`\`\`\`ansi\n${messages.map(msg => `[33m${msg.author.username}:[37m ${msg.content}`).reverse().join('\n').slice(0, 3900)}\`\`\``)
        .addFields({ name: '🔹 Channel', value: `<#${channel.id}>` })
        .setColor(client.config.embedColor)
        .setTimestamp()
    ] });
}
