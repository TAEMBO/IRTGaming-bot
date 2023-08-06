import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, message: Discord.Message<boolean> | Discord.PartialMessage) => {
    if (
        !client.config.botSwitches.logs
        || !message.inGuild()
        || message.author.bot
        || client.config.whitelist.logs.some(x => [message.channelId, message.channel.parentId ?? ''].includes(x))
    ) return;

    const embed = new EmbedBuilder()
        .setTitle('Message Deleted')
        .setDescription(`<@${message.author.id}>\n\`${message.author.id}\``)
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128 }) })
        .setColor(client.config.embedColorRed)
        .setTimestamp()

    if (message.content.length) embed.addFields({ name: '🔹 Content', value: `\`\`\`\n${message.content.slice(0, 1000)}\n\`\`\`` });

    embed.addFields(
        { name: '🔹 Channel', value: message.channel.toString() },
        { name: '🔹 Sent', value: `<t:${Math.round(message.createdTimestamp / 1000)}:R>` }
    );

    client.getChan('botLogs').send({ embeds: [embed], files: message.attachments.map(x => x.url) });
} 
