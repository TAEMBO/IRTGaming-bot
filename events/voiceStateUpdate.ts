import Discord, { EmbedBuilder } from "discord.js";
import YClient from '../client.js';
import { formatUser } from '../utilities.js';

export default async (client: YClient, oldState: Discord.VoiceState, newState: Discord.VoiceState) => {
    if (!client.config.botSwitches.logs || !newState.member) return;

    const channel = client.getChan('botLogs');
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setDescription(formatUser(newState.member.user))
        .setAuthor({ name: newState.member.user.tag, iconURL: newState.member.user.displayAvatarURL({ extension: 'png', size: 2048 }) });

    if (!oldState.channelId && newState.channelId) { // Joined VC
        embed
            .setTitle('Member Joined VC')
            .setColor(client.config.embedColorGreen)
            .addFields({ name: '🔹 Channel', value: `<#${newState.channelId}>` });

        channel.send({ embeds: [embed] });
    } else if (oldState.channelId && !newState.channelId) { // Left VC
        embed
            .setTitle('Member Left VC')
            .setColor(client.config.embedColorRed)
            .addFields({ name: '🔹 Channel', value: `<#${oldState.channelId}>` });

        channel.send({ embeds: [embed] });
    } else if (oldState.channelId && newState.channelId && newState.channelId !== oldState.channelId) { // Moved VC
        embed
            .setTitle('Member Moved VC')
            .setColor(client.config.embedColor)
            .addFields(
                { name: '🔹 Old Channel', value: `<#${oldState.channelId}>` },
                { name: '🔹 New Channel', value: `<#${newState.channelId}>` }
            );
            
        channel.send({ embeds: [embed] });
    }
}