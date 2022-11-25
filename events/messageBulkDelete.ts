import Discord, { Message, Snowflake } from 'discord.js';
import YClient from '../client';

export default {
    name: "messageDeleteBulk",
    execute: async (client: YClient, messages: Discord.Collection<Snowflake, Message>) => {
        const channel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
         if (!client.config.botSwitches.logs) return;
         let msgArray: Array<string> = [];
         messages.forEach((e)=>{
             msgArray.push(`${e.author.username}: ${e.content}`);
         });
         const embed = new client.embed()
         .setTitle(`${messages.size} Messages Were Deleted.`)
         .setDescription(`\`\`\`${msgArray.reverse().join('\n')}\`\`\``.slice(0, 3900))
         .addFields({name: 'Channel', value: `<#${(messages.first() as Discord.Message).channel.id}>`})
         .setColor(client.config.embedColor)
         .setTimestamp()
         channel.send({embeds: [embed]})
        
    }
}
