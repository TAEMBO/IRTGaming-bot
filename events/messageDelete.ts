import Discord from 'discord.js';
import YClient from '../client.js';
import { getChan } from '../utilities.js';

export default async (client: YClient, message: Discord.Message<boolean> | Discord.PartialMessage) => {
    if (!client.config.botSwitches.logs || message.partial || message.author.bot || client.config.blacklistedCh.includes(message.channel.id) || message.channel.type === 1) return;

    const embed = new client.embed()
        .setTitle('Message Deleted')
        .setDescription(`<@${message.author.id}>\n\`${message.author.id}\``)
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128 }) })
        .setColor(client.config.embedColorRed)
        .setTimestamp()

    if (message.content.length) embed.addFields({ name: '🔹 Content', value: `\`\`\`\n${message.content.slice(0, 1000)}\n\`\`\`` });

    embed.addFields(
        { name: '🔹 Channel', value: `<#${message.channel.id}>` },
        { name: '🔹 Sent', value: `<t:${Math.round(message.createdTimestamp / 1000)}:R>` });

    getChan(client, 'botLogs').send({ embeds: [embed], files: message.attachments.map(x => x.url) });
} 
