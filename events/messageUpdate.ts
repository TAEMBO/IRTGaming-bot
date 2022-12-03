import Discord, {ActionRowBuilder, ButtonBuilder} from "discord.js";
import YClient from "../client";

export default {
    name: "messageUpdate",
    execute: async (client: YClient, oldMsg: Discord.Message, newMsg: Discord.Message) => {
        await oldMsg.fetch();
        await newMsg.fetch();
        if (!client.config.botSwitches.logs || newMsg.author.bot || oldMsg.partial || newMsg.partial || !oldMsg.member || oldMsg.content.length == 0 || newMsg.content == oldMsg.content) return;
        const logChannel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
        const msgarr = newMsg.content.toLowerCase().split(' ');

        if (client.bannedWords._content.some((word: string) => msgarr.includes(word)) && (!client.isMPStaff(oldMsg.member) && !client.hasModPerms(oldMsg.member))) newMsg.delete();

        const embed = new client.embed()
            .setTitle('Message Edited')
            .setDescription(`<@${oldMsg.author.id}>\n\`${oldMsg.author.id}\``)
            .addFields(
                {name: '🔹 Old Content', value: `\`\`\`\n${oldMsg.content.slice(0, 1000)}\n\`\`\``},
                {name: '🔹 New Content', value: `\`\`\`\n${newMsg.content.slice(0, 1000)}\n\`\`\``},
                {name: '🔹 Channel', value: `<#${oldMsg.channel.id}>`}
            )
            .setAuthor({name: newMsg.author.tag, iconURL: newMsg.author.displayAvatarURL({ extension: 'png', size: 128}) || newMsg.author.defaultAvatarURL})
            .setColor(client.config.embedColor)
            .setTimestamp();
        logChannel.send({embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`${oldMsg.url}`).setLabel("Jump to message"))]})
    }
}
