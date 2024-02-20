import { EmbedBuilder, type VoiceState } from "discord.js";
import { formatUser } from "../util/index.js";

export default async (oldState: VoiceState, newState: VoiceState) => {
    if (!newState.client.config.toggles.logs || !newState.member) return;

    const channel = newState.client.getChan("botLogs");
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setDescription(formatUser(newState.member.user))
        .setAuthor({ name: newState.member.user.tag, iconURL: newState.member.user.displayAvatarURL({ extension: "png", size: 2048 }) });

    if (!oldState.channelId && newState.channelId) { // Joined VC
        embed
            .setTitle("Member Joined VC")
            .setColor(newState.client.config.EMBED_COLOR_GREEN)
            .addFields({ name: "🔹 Channel", value: `<#${newState.channelId}>` });

        await channel.send({ embeds: [embed] });
    } else if (oldState.channelId && !newState.channelId) { // Left VC
        embed
            .setTitle("Member Left VC")
            .setColor(newState.client.config.EMBED_COLOR_RED)
            .addFields({ name: "🔹 Channel", value: `<#${oldState.channelId}>` });

        await channel.send({ embeds: [embed] });
    } else if (oldState.channelId && newState.channelId && newState.channelId !== oldState.channelId) { // Moved VC
        embed
            .setTitle("Member Moved VC")
            .setColor(newState.client.config.EMBED_COLOR)
            .addFields(
                { name: "🔹 Old Channel", value: `<#${oldState.channelId}>` },
                { name: "🔹 New Channel", value: `<#${newState.channelId}>` }
            );
            
        await channel.send({ embeds: [embed] });
    }
};