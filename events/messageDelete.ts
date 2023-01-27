import Discord from 'discord.js';
import YClient from '../client';

export default async (client: YClient, message: Discord.Message) => {
    if (!client.config.botSwitches.logs || message.partial || message.author.bot || ['979863373439184966', '968265015595532348'].includes(message.channel.id)) return;
    const logChannel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;

    const embed = new client.embed()
        .setTitle('Message Deleted')
        .setDescription(`<@${message.author.id}>\n\`${message.author.id}\``)
        .setAuthor({name: message.author.tag, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128}) || message.author.defaultAvatarURL})
        .setColor(client.config.embedColorRed)
        .setTimestamp()
    if (message.content.length != 0) embed.addFields({name: '🔹 Content', value: `\`\`\`\n${message.content.slice(0, 1000)}\n\`\`\``});
    embed.addFields(
        {name: '🔹 Channel', value: `<#${message.channel.id}>`},
        {name: '🔹 Sent At', value: `<t:${Math.round(message.createdTimestamp / 1000)}>\n<t:${Math.round(message.createdTimestamp / 1000)}:R>`}
    )

    logChannel.send({embeds: [embed], files: message.attachments.map(x => x.url)});
} 
