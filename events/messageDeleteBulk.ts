import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, messages: Discord.Collection<string, Discord.Message<boolean>>, channel: Discord.GuildTextBasedChannel) => {
    if (!client.config.botSwitches.logs) return;

    (client.channels.resolve(client.config.mainServer.channels.botLogs) as Discord.TextChannel).send({embeds: [new client.embed()
        .setTitle(`${messages.size} messages were deleted`)
        .setDescription(`\`\`\`ansi\n${messages.map(msg => `[33m${msg.author.username}:[37m ${msg.content}`).reverse().join('\n').slice(0, 3900)}\`\`\``)
        .addFields({name: '🔹 Channel', value: `<#${channel.id}>`})
        .setColor(client.config.embedColor)
        .setTimestamp()
    ]});
}
