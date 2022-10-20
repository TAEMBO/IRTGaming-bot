module.exports = {
    name: "messageDelete",
    execute: async (client, msg) => {
        if (!client.config.botSwitches.logs) return;
        const channel = client.channels.resolve(client.config.mainServer.channels.modlogs);
        if (msg.partial) return;
        if (msg.author.bot) return;
        const embed = new client.embed()
            .setTitle("Message Deleted!")
            .setDescription(`<@${msg.author.id}>\nContent:\n\`\`\`\n${msg.content}\n\`\`\`\nChannel: <#${msg.channel.id}>`)
            .setAuthor({name: `Author: ${msg.author.tag} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`})
            .setColor(client.config.embedColorRed)
            .setTimestamp()
            channel.send({embeds: [embed]})
        if (msg.attachments?.first()?.width && ['png', 'jpeg', 'jpg', 'gif'].some(x => msg.attachments.first().name.endsWith(x))) {
            channel.send({files: [msg.attachments?.first()]})
    }
   } 
  }
