import Discord, {ActionRowBuilder, ButtonBuilder} from "discord.js";
import YClient from "../client";

export default {
    name: "messageUpdate",
    execute: async (client: YClient, oldMsg: Discord.Message, newMsg: Discord.Message) => {
        if (!client.config.botSwitches.logs || oldMsg.author.bot || oldMsg.partial || newMsg.partial || !oldMsg.member || oldMsg.content.length == 0 || newMsg.content == oldMsg.content) return;
        const logChannel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
        const msgarr = newMsg.content.toLowerCase().split(' ');

        if (client.bannedWords._content.some((word: string) => msgarr.includes(word)) && (!client.isMPStaff(oldMsg.member) && !client.hasModPerms(oldMsg.member))) newMsg.delete();

        const embed = new client.embed()
            .setTitle(`Message Edited: ${oldMsg.author.tag}`)
            .setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``)
            .addFields(
                {name: '🔹 Old Content', value: `\`\`\`\n${oldMsg.content}\n\`\`\``},
                {name: '🔹 New Content', value: `\`\`\`\n${newMsg.content}\n\`\`\``},
                {name: '🔹 Channel', value: `<#${oldMsg.channel.id}>`}
            )
            .setThumbnail(oldMsg.author.displayAvatarURL({ extension: 'png', size: 2048}) || oldMsg.author.defaultAvatarURL)
            .setColor(client.config.embedColor)
            .setTimestamp();
        logChannel.send({embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`${oldMsg.url}`).setLabel("Jump to message"))]})
    }
}
