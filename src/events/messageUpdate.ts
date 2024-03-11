import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    codeBlock,
    EmbedBuilder,
    Events
} from "discord.js";
import { Event } from "../structures/index.js";
import { formatUser, hasProfanity, isDCStaff, isMPStaff } from "../util/index.js";

export default new Event({
    name: Events.MessageUpdate,
    async run(oldMessage, newMessage) {
        if (
            !oldMessage.content
            || newMessage.content === oldMessage.content
            || !newMessage.inGuild()
            || newMessage.author.bot
            || newMessage.client.config.whitelist.logs.some(x => [newMessage.channelId, newMessage.channel.parentId].includes(x))
        ) return;
    
        const msg = newMessage.content.replaceAll("\n", " ").toLowerCase();
    
        if (
            hasProfanity(msg, newMessage.client.bannedWords.data)
            && (
                !isMPStaff(newMessage.member)
                && !isDCStaff(newMessage.member)
            )) await newMessage.delete();
    
        if (!newMessage.client.config.toggles.logs) return;
    
        let oldContent = oldMessage.content;
        const newContent = newMessage.content;
        const editedWordsOld = oldContent.split(" ").filter(oldWord => !newContent.split(" ").some(newWord => oldWord === newWord));
        const editedWordsNew = newContent.split(" ").filter(newWord => !oldContent.split(" ").some(oldWord => newWord === oldWord));
        
        for (const word of editedWordsOld) oldContent = oldContent.replace(word, `[31m${word}[0m`);
        for (const word of editedWordsNew) oldContent = oldContent.replace(word, `[31m${word}[0m`);
    
        await newMessage.client.getChan("botLogs").send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Message Edited")
                    .setDescription(formatUser(newMessage.author))
                    .addFields(
                        { name: "🔹 Old Content", value: codeBlock("ansi", oldContent.slice(0, 1000)) },
                        { name: "🔹 New Content", value: codeBlock("ansi", newContent.slice(0, 1000)) },
                        { name: "🔹 Channel", value: oldMessage.channel.toString() })
                    .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL({ extension: "png", size: 128 }) })
                    .setColor(newMessage.client.config.EMBED_COLOR)
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(oldMessage.url).setLabel("Jump to message"))
            ]
        });
    }
});