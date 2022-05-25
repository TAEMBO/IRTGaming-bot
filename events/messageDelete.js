module.exports = {
    name: "messageDelete",
    giveaway: false,
    tracker: false,
    frs: false,
    execute: async (client, msg) => {
        const channel = await client.channels.fetch(require("../config.json").mainServer.channels.modlogs);
        if (!client.config.botSwitches.automod) return;
        if (msg.partial) return;
        if (msg.author.bot) return;
        if (msg.guild?.id !== client.config.mainServer.id) return;
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