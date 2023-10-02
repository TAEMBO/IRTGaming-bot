import { EmbedBuilder, GuildMember, PartialGuildMember } from 'discord.js';
import { formatUser } from '../utilities.js';
import { TClient } from '../typings.js';

export default async (oldMember: TClient<GuildMember | PartialGuildMember>, newMember: TClient<GuildMember>) => {
    if (!newMember.client.config.botSwitches.logs) return;

    let changes = false;
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setColor(newMember.client.config.embedColor)
        .setTitle(`Member Update: ${newMember.user.tag}`)
        .setDescription(formatUser(newMember.user))
        .setThumbnail(newMember.user.displayAvatarURL({ extension: 'png', size: 2048 }));

    // Nickname changes
    if (oldMember.nickname !== newMember.nickname) {
        changes = true;
        embed.addFields(
            { name: '🔹 Old Nickname', value: oldMember.nickname ? `\`\`\`${oldMember.nickname}\`\`\`` : '*No nickname*' },
            { name: '🔹 New Nickname', value: newMember.nickname ? `\`\`\`${newMember.nickname}\`\`\`` : '*No nickname*' })
    }

    // Role changes
    const newRoles = newMember.roles.cache.filter((x, i) => !oldMember.roles.cache.has(i));
    const oldRoles = oldMember.roles.cache.filter((x, i) => !newMember.roles.cache.has(i));
    const boosterRole = newMember.client.config.mainServer.roles.legendarynitrobooster;

    if ((newRoles.size || oldRoles.size) && ((Date.now() - (newMember.joinedTimestamp as number)) > 5000)) {
        if (newRoles.size) embed.addFields({ name: '🔹 Roles Added', value: newRoles.map(x => x.toString()).join(' ') });
        if (oldRoles.size) embed.addFields({ name: '🔹 Roles Removed', value: oldRoles.map(x => x.toString()).join(' ') });

        changes = true;
    }
    
    if (changes) await newMember.client.getChan('botLogs').send({ embeds: [embed] });

    if (oldRoles.has(boosterRole) || newRoles.has(boosterRole)) await newMember.client.getChan('boostLogs').send({ embeds: [embed] });
}
