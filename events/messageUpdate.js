const {ActionRowBuilder, ButtonBuilder} = require("discord.js");
module.exports = {
    name: "messageUpdate",
    execute: async (client, oldMsg, newMsg) => {
        if (!client.config.botSwitches.logs) return;
        if (oldMsg.author.bot) return;
        if (oldMsg.partial) return;
        if (newMsg.partial) return;
        const msgarr = newMsg.content.toLowerCase().split(' ');
        if (client.bannedWords._content.some(word => msgarr.includes(word))) newMsg.delete();
        if (newMsg.content === oldMsg.content) return;
        const embed = new client.embed()
            .setTitle("Message Edited!")
            .setDescription(`<@${oldMsg.author.id}>\nOld Content:\n\`\`\`\n${oldMsg.content}\n\`\`\`\nNew Content:\n\`\`\`\n${newMsg.content}\n\`\`\`\nChannel: <#${oldMsg.channel.id}>`)
            .setAuthor({name: `Author: ${oldMsg.author.tag} (${oldMsg.author.id})`, iconURL: `${oldMsg.author.displayAvatarURL()}`})
            .setColor(client.config.embedColor)
            .setTimestamp(Date.now())
        client.channels.resolve(client.config.mainServer.channels.modlogs).send({embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle("Link").setURL(`${oldMsg.url}`).setLabel("Jump to message"))]})
    }
}
