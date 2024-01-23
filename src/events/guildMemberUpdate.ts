import { EmbedBuilder, type GuildMember, type PartialGuildMember } from "discord.js";
import { formatUser } from "../utils.js";

export default async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    if (!newMember.client.config.toggles.logs) return;

    let changes = false;
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setColor(newMember.client.config.EMBED_COLOR)
        .setTitle(`Member Update: ${newMember.user.tag}`)
        .setDescription(formatUser(newMember.user))
        .setThumbnail(newMember.user.displayAvatarURL({ extension: 'png', size: 2048 }));

    // Nickname changes
    if (oldMember.nickname !== newMember.nickname) {
        changes = true;

        embed.addFields(
            { name: '🔹 Old Nickname', value: oldMember.nickname ? `\`\`\`${oldMember.nickname}\`\`\`` : '*No nickname*' },
            { name: '🔹 New Nickname', value: newMember.nickname ? `\`\`\`${newMember.nickname}\`\`\`` : '*No nickname*' }
        );
    }

    // Role changes
    const newRoles = newMember.roles.cache.filter(x => !oldMember.roles.cache.has(x.id));
    const oldRoles = oldMember.roles.cache.filter(x => !newMember.roles.cache.has(x.id));
    const boosterRole = newMember.client.config.mainServer.roles.legendarynitrobooster;

    if ((newRoles.size || oldRoles.size) && ((Date.now() - (newMember.joinedTimestamp as number)) > 5000)) {
        if (newRoles.size) embed.addFields({ name: '🔹 Roles Added', value: newRoles.map(x => x.toString()).join(' ') });
        if (oldRoles.size) embed.addFields({ name: '🔹 Roles Removed', value: oldRoles.map(x => x.toString()).join(' ') });

        changes = true;
    }
    
    if (changes) await newMember.client.getChan('botLogs').send({ embeds: [embed] });

    if (oldRoles.has(boosterRole) || newRoles.has(boosterRole)) {
        embed.setColor("#f47fff").setFooter({ text: `Total boosts: ${newMember.guild.premiumSubscriptionCount}`});

        await newMember.client.getChan('boostLogs').send({ embeds: [embed] });
    }
}
