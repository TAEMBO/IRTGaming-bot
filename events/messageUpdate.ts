import Discord, {ActionRowBuilder, ButtonBuilder} from "discord.js";
import YClient from "../client";

export default {
    name: "messageUpdate",
    execute: async (client: YClient, oldMsg: Discord.Message, newMsg: Discord.Message) => {
        if (!client.config.botSwitches.logs || oldMsg.author.bot || oldMsg.partial || newMsg.partial || !newMsg.member || oldMsg.content.length == 0) return;
        const msgarr = newMsg.content.toLowerCase().split(' ');
        if (client.bannedWords._content.some((word: string) => msgarr.includes(word)) && (!client.isMPStaff(newMsg.member) && !client.hasModPerms(newMsg.member))) newMsg.delete();
        if (newMsg.content === oldMsg.content) return;
        const embed = new client.embed()
            .setTitle("Message Edited!")
            .setDescription(`<@${oldMsg.author.id}>\nOld Content:\n\`\`\`\n${oldMsg.content}\n\`\`\`\nNew Content:\n\`\`\`\n${newMsg.content}\n\`\`\`\nChannel: <#${oldMsg.channel.id}>`)
            .setAuthor({name: `Author: ${oldMsg.author.tag} (${oldMsg.author.id})`, iconURL: `${oldMsg.author.displayAvatarURL()}`})
            .setColor(client.config.embedColor)
            .setTimestamp();
        (client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel).send({embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`${oldMsg.url}`).setLabel("Jump to message"))]})
    }
}
