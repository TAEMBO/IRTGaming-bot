import Discord, { Message, Snowflake } from 'discord.js';
import YClient from '../client';

export default {
    name: "messageDeleteBulk",
    execute: async (client: YClient, messages: Discord.Collection<Snowflake, Message>, channel: Discord.GuildTextBasedChannel) => {
        if (!client.config.botSwitches.logs) return;

        const logChannel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
        let msgArray: Array<string> = [];

        messages.forEach((e)=>{
            msgArray.push(`${e.author.username}: ${e.content}`);
        });
        const embed = new client.embed()
            .setTitle(`${messages.size} messages were deleted`)
            .setDescription(`\`\`\`${msgArray.reverse().join('\n')}\`\`\``.slice(0, 3900))
            .addFields({name: '🔹 Channel', value: `<#${channel.id}>`})
            .setColor(client.config.embedColor)
            .setTimestamp()
        logChannel.send({embeds: [embed]})
        
    }
}
