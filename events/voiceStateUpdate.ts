import Discord, { EmbedBuilder } from "discord.js";
import { formatUser } from '../utilities.js';
import { TClient } from '../typings.js';

export default async (oldState: TClient<Discord.VoiceState>, newState: TClient<Discord.VoiceState>) => {
    if (!newState.client.config.botSwitches.logs || !newState.member) return;

    const channel = newState.client.getChan('botLogs');
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setDescription(formatUser(newState.member.user))
        .setAuthor({ name: newState.member.user.tag, iconURL: newState.member.user.displayAvatarURL({ extension: 'png', size: 2048 }) });

    if (!oldState.channelId && newState.channelId) { // Joined VC
        embed
            .setTitle('Member Joined VC')
            .setColor(newState.client.config.embedColorGreen)
            .addFields({ name: '🔹 Channel', value: `<#${newState.channelId}>` });

        channel.send({ embeds: [embed] });
    } else if (oldState.channelId && !newState.channelId) { // Left VC
        embed
            .setTitle('Member Left VC')
            .setColor(newState.client.config.embedColorRed)
            .addFields({ name: '🔹 Channel', value: `<#${oldState.channelId}>` });

        channel.send({ embeds: [embed] });
    } else if (oldState.channelId && newState.channelId && newState.channelId !== oldState.channelId) { // Moved VC
        embed
            .setTitle('Member Moved VC')
            .setColor(newState.client.config.embedColor)
            .addFields(
                { name: '🔹 Old Channel', value: `<#${oldState.channelId}>` },
                { name: '🔹 New Channel', value: `<#${newState.channelId}>` }
            );
            
        channel.send({ embeds: [embed] });
    }
}