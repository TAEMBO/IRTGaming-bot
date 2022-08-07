module.exports = {
    name: "messageDelete",
    execute: async (client, msg) => {
        const channel = await client.channels.fetch(client.config.mainServer.channels.modlogs);
        if (!client.config.botSwitches.logs) return;
        if (msg.partial) return;
        if (msg.author.bot) return;
        const embed = new client.embed()
            .setTitle("Message Deleted!")
            .setDescription(`<@${msg.author.id}>\nContent:\n\`\`\`\n${msg.content}\n\`\`\`\nChannel: <#${msg.channel.id}>`)
            .setAuthor({name: `Author: ${msg.author.tag} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`})
            .setColor(client.config.embedColorRed)
            .setTimestamp(Date.now())
            channel.send({embeds: [embed]})
        if (msg.attachments?.first()?.width && ['png', 'jpeg', 'jpg', 'gif'].some(x => msg.attachments.first().name.endsWith(x))) {
            channel.send({files: [msg.attachments?.first()]})
    }
   } 
  }
