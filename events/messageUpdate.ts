import Discord, { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import YClient from "../client.js";
import { isDCStaff, isMPStaff, Profanity } from '../utilities.js';

export default async (client: YClient, oldMsg: Discord.Message<boolean> | Discord.PartialMessage, newMsg: Discord.Message<boolean> | Discord.PartialMessage) => {
    if (!client.config.botSwitches.logs || newMsg.author?.bot || oldMsg.partial || newMsg.partial || !oldMsg.member || !oldMsg.content || newMsg.content === oldMsg.content || client.config.blacklistedCh.includes(newMsg.channel.id)) return;

    const msg = newMsg.content.replaceAll('\n', ' ').toLowerCase();
    const profanity = new Profanity(msg);

    if (profanity.hasProfanity(client.bannedWords._content) && (!isMPStaff(oldMsg.member) && !isDCStaff(oldMsg.member))) newMsg.delete();

    let oldContent = oldMsg.content;
    let newContent = newMsg.content;
    const editedWordsOld = oldContent.split(' ').filter(oldWord => !newContent.split(' ').some(newWord => oldWord === newWord));
    const editedWordsNew = newContent.split(' ').filter(newWord => !oldContent.split(' ').some(oldWord => newWord === oldWord));
    
    editedWordsOld.forEach(word => oldContent = oldContent.replace(word, `[31m${word}[0m`));
    editedWordsNew.forEach(word => newContent = newContent.replace(word, `[32m${word}[0m`));

    client.getChan('botLogs').send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Message Edited')
                .setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``)
                .addFields(
                    { name: '🔹 Old Content', value: `\`\`\`ansi\n${oldContent.slice(0, 1000)}\n\`\`\`` },
                    { name: '🔹 New Content', value: `\`\`\`ansi\n${newContent.slice(0, 1000)}\n\`\`\`` },
                    { name: '🔹 Channel', value: oldMsg.channel.toString() })
                .setAuthor({ name: newMsg.author.tag, iconURL: newMsg.author.displayAvatarURL({ extension: 'png', size: 128 }) })
                .setColor(client.config.embedColor)
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(oldMsg.url).setLabel("Jump to message"))
        ]
    });
}
