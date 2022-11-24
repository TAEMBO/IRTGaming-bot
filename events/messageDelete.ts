import Discord from 'discord.js';
import YClient from '../client';

export default {
    name: "messageDelete",
    execute: async (client: YClient, msg: Discord.Message) => {
        if (!client.config.botSwitches.logs) return;
        const channel = client.channels.resolve(client.config.mainServer.channels.modlogs) as Discord.TextChannel;
        if (msg.partial) return;
        if (msg.author.bot) return;
        const embed = new client.embed()
            .setTitle("Message Deleted!")
            .setDescription(`<@${msg.author.id}>\nContent:\n\`\`\`\n${msg.content}\n\`\`\`\nChannel: <#${msg.channel.id}>\nSent at: <t:${Math.round(msg.createdTimestamp / 1000)}>`)
            .setAuthor({name: `Author: ${msg.author.tag} (${msg.author.id})`, iconURL: `${msg.author.displayAvatarURL()}`})
            .setColor(client.config.embedColorRed)
            .setTimestamp()
            channel.send({embeds: [embed]})
        if (msg.attachments?.first()?.width && ['png', 'jpeg', 'jpg', 'gif'].some(x => ((msg.attachments.first() as Discord.Attachment).name as string).endsWith(x))) {
            channel.send({files: [msg.attachments?.first() as Discord.Attachment]})
    }
   } 
  }
