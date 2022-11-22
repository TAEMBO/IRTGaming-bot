import Discord from "discord.js";
import { YClient } from '../client';

export default {
    name: "voiceStateUpdate",
    async execute(client: YClient, oldState: Discord.VoiceState, newState: Discord.VoiceState) {
        if (!newState.member) return;
        if (!client.config.botSwitches.logs) return;
        const channel = client.channels.resolve(client.config.mainServer.channels.modlogs) as Discord.TextChannel;
        const embed = new client.embed().setTimestamp().setDescription(`<@${newState.member.user.id}>\n\`${newState.member.user.id}\``);
        embed.setThumbnail(newState.member.user.avatarURL({ extension: 'png', size: 2048}) || newState.member.user.defaultAvatarURL)
        if (oldState.channelId == null && newState.channelId != null) { // Joined VC
            embed.setTitle(`Member joined VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColorGreen)
            embed.addFields({name: `\u200b`, value: `**Channel:** <#${newState.channelId}>`})
            channel.send({embeds: [embed]});
        } else if (oldState.channelId != null && newState.channelId == null) { // Left VC
            embed.setTitle(`Member left VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColorRed)
            embed.addFields({name: '\u200b', value: `**Channel:** <#${oldState.channelId}>`})
            channel.send({embeds: [embed]})
        } else if (oldState.channelId != null && newState.channelId != null && newState.channelId != oldState.channelId) { // Moved VC
            embed.setTitle(`Member moved VC: ${newState.member.user.username}#${newState.member.user.discriminator}`).setColor(client.config.embedColor)
            embed.addFields({name: '🔹 Channels', value: `<#${oldState.channelId}> to <#${newState.channelId}>`})
            channel.send({embeds: [embed]})
        }
        
    }
}