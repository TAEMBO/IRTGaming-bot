import { EmbedBuilder, Message, PartialMessage } from 'discord.js';
import { formatUser } from '../utilities.js';
import { TClient } from '../typings.js';

export default async (message: TClient<Message<boolean> | PartialMessage>) => {
    if (
        !message.client.config.botSwitches.logs
        || message.partial
        || !message.inGuild()
        || message.author.bot
        || message.client.config.whitelist.logs.some(x => [message.channelId, message.channel.parentId ?? ''].includes(x))
    ) return;

    const embed = new EmbedBuilder()
        .setTitle('Message Deleted')
        .setDescription(formatUser(message.author))
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128 }) })
        .setColor(message.client.config.embedColorRed)
        .setTimestamp()

    if (message.content.length) embed.addFields({ name: '🔹 Content', value: `\`\`\`\n${message.content.slice(0, 1000)}\n\`\`\`` });

    embed.addFields(
        { name: '🔹 Channel', value: message.channel.toString() },
        { name: '🔹 Sent', value: `<t:${Math.round(message.createdTimestamp / 1000)}:R>` }
    );

    await message.client.getChan('botLogs').send({ embeds: [embed], files: message.attachments.toJSON() });
} 
