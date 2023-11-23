import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, PartialMessage } from "discord.js";
import { formatUser, isDCStaff, isMPStaff, Profanity } from '../utilities.js';

export default async (oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
    if (
        !newMsg.client.config.toggles.logs
        || !oldMsg.content
        || newMsg.content === oldMsg.content
        || !newMsg.inGuild()
        || newMsg.author.bot
        || newMsg.client.config.whitelist.logs.some(x => [newMsg.channelId, newMsg.channel.parentId].includes(x))
    ) return;

    const msg = newMsg.content.replaceAll('\n', ' ').toLowerCase();
    const profanity = new Profanity(msg);

    if (profanity.hasProfanity(newMsg.client.bannedWords.data) && (!isMPStaff(newMsg.member) && !isDCStaff(newMsg.member))) await newMsg.delete();

    let oldContent = oldMsg.content;
    let newContent = newMsg.content;
    const editedWordsOld = oldContent.split(' ').filter(oldWord => !newContent.split(' ').some(newWord => oldWord === newWord));
    const editedWordsNew = newContent.split(' ').filter(newWord => !oldContent.split(' ').some(oldWord => newWord === oldWord));
    
    for (const word of editedWordsOld) oldContent = oldContent.replace(word, `[31m${word}[0m`);
    for (const word of editedWordsNew) oldContent = oldContent.replace(word, `[31m${word}[0m`);

    await newMsg.client.getChan('botLogs').send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Message Edited')
                .setDescription(formatUser(newMsg.author))
                .addFields(
                    { name: '🔹 Old Content', value: `\`\`\`ansi\n${oldContent.slice(0, 1000)}\n\`\`\`` },
                    { name: '🔹 New Content', value: `\`\`\`ansi\n${newContent.slice(0, 1000)}\n\`\`\`` },
                    { name: '🔹 Channel', value: oldMsg.channel.toString() })
                .setAuthor({ name: newMsg.author.tag, iconURL: newMsg.author.displayAvatarURL({ extension: 'png', size: 128 }) })
                .setColor(newMsg.client.config.EMBED_COLOR)
                .setTimestamp()
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(oldMsg.url).setLabel("Jump to message"))
        ]
    });
}
