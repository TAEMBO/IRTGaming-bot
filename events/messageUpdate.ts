import Discord, { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import YClient from "../client";

export default async (client: YClient, oldMsg: Discord.Message<boolean>, newMsg: Discord.Message<boolean>) => {
    if (!client.config.botSwitches.logs || newMsg.author.bot || oldMsg.partial || newMsg.partial || !oldMsg.member || oldMsg.content.length == 0 || newMsg.content === oldMsg.content || ['979863373439184966', '968265015595532348'].includes(newMsg.channel.id)) return;
    const msgarr = newMsg.content.toLowerCase().split(' ');

    if (client.bannedWords._content.some(word => msgarr.includes(word)) && (!client.isMPStaff(oldMsg.member) && !client.hasModPerms(oldMsg.member))) newMsg.delete();

    (client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel).send({embeds: [new client.embed()
        .setTitle('Message Edited')
        .setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``)
        .addFields(
            {name: '🔹 Old Content', value: `\`\`\`\n${oldMsg.content.slice(0, 1000)}\n\`\`\``},
            {name: '🔹 New Content', value: `\`\`\`\n${newMsg.content.slice(0, 1000)}\n\`\`\``},
            {name: '🔹 Channel', value: `<#${oldMsg.channel.id}>`})
        .setAuthor({ name: newMsg.author.tag, iconURL: newMsg.author.displayAvatarURL({ extension: 'png', size: 128 }) })
        .setColor(client.config.embedColor)
        .setTimestamp()
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(oldMsg.url).setLabel("Jump to message"))]});
}
