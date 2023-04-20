import Discord, { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import YClient from "../client.js";

export default async (client: YClient, oldMsg: Discord.Message<true>, newMsg: Discord.Message<true>) => {
    if (!client.config.botSwitches.logs || newMsg.author.bot || oldMsg.partial || newMsg.partial || !oldMsg.member || oldMsg.content.length == 0 || newMsg.content === oldMsg.content || ['979863373439184966', '968265015595532348'].includes(newMsg.channel.id)) return;
    const msgarr = newMsg.content.toLowerCase().split(' ');

    if (client.bannedWords._content.some(word => msgarr.includes(word)) && (!client.isMPStaff(oldMsg.member) && !client.hasModPerms(oldMsg.member))) newMsg.delete();

    let oldContent = oldMsg.content;
    let newContent = newMsg.content;
    const editedWordsOld = oldContent.split(' ').filter(oldWord => !newContent.split(' ').some(newWord => oldWord === newWord));
    const editedWordsNew = newContent.split(' ').filter(newWord => !oldContent.split(' ').some(oldWord => newWord === oldWord));
    
    editedWordsOld.forEach(word => oldContent = oldContent.replace(word, `[31m${word}[37m`));
    editedWordsNew.forEach(word => newContent = newContent.replace(word, `[32m${word}[37m`));

    (client.channels.resolve(client.config.mainServer.channels.botLogs) as Discord.TextChannel).send({embeds: [new client.embed()
        .setTitle('Message Edited')
        .setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``)
        .addFields(
            { name: '🔹 Old Content', value: `\`\`\`ansi\n${oldContent.slice(0, 1000)}\n\`\`\`` },
            { name: '🔹 New Content', value: `\`\`\`ansi\n${newContent.slice(0, 1000)}\n\`\`\`` },
            { name: '🔹 Channel', value: `<#${oldMsg.channel.id}>` })
        .setAuthor({ name: newMsg.author.tag, iconURL: newMsg.author.displayAvatarURL({ extension: 'png', size: 128 }) })
        .setColor(client.config.embedColor)
        .setTimestamp()
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(oldMsg.url).setLabel("Jump to message"))]});
}
