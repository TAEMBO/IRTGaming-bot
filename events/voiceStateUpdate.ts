import Discord from "discord.js";
import YClient from '../client';

export default {
    async run(client: YClient, oldState: Discord.VoiceState, newState: Discord.VoiceState) {
        if (!client.config.botSwitches.logs || !newState.member) return;

        const channel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
        const embed = new client.embed().setTimestamp().setDescription(`<@${newState.member.user.id}>\n\`${newState.member.user.id}\``);

        embed.setThumbnail(newState.member.user.avatarURL({ extension: 'png', size: 2048}) || newState.member.user.defaultAvatarURL)

        if (oldState.channelId == null && newState.channelId != null) { // Joined VC
            embed.setTitle(`Member Joined VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColorGreen)
            embed.addFields({name: '🔹 Channel', value: `<#${newState.channelId}>`})
            channel.send({embeds: [embed]});
        } else if (oldState.channelId != null && newState.channelId == null) { // Left VC
            embed.setTitle(`Member Left VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColorRed)
            embed.addFields({name: '🔹 Channel', value: `<#${oldState.channelId}>`})
            channel.send({embeds: [embed]})
        } else if (oldState.channelId != null && newState.channelId != null && newState.channelId != oldState.channelId) { // Moved VC
            embed.setTitle(`Member Moved VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColor)
            embed.addFields(
                {name: '🔹 Old Channel', value: `<#${oldState.channelId}>`},
                {name: '🔹 New Channel', value: `<#${newState.channelId}>`}
            )
            channel.send({embeds: [embed]})
        }
        
    }
}