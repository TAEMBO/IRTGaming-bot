import Discord, { EmbedBuilder } from 'discord.js';
import { formatUser } from '../utilities.js';
import { TClient } from '../typings.js';

export default async (member: TClient<Discord.GuildMember>) => {
    if (!member.client.config.botSwitches.logs || !member.joinedTimestamp) return;
        
    const rankingData = await member.client.userLevels.data.findById(member.id);
    const embed = new EmbedBuilder()
        .setTitle(`Member Left: ${member.user.tag}`)
        .setDescription(formatUser(member.user))
        .addFields(
            { name: '🔹 Account Created', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
            { name: '🔹 Joined server', value: `<t:${Math.round(member.joinedTimestamp / 1000)}:R>` },
            { name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== member.client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None', inline: true })
        .setTimestamp()
        .setColor(member.client.config.embedColorRed)
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }));

    if (rankingData && rankingData.messages) embed.addFields({ name: '🔹 Ranking Total', value: rankingData.messages.toLocaleString('en-US'), inline: true });

    member.client.getChan('botLogs').send({ embeds: [embed] });
    
    member.client.getChan('leaveLogs').send(`**${member.user.tag}** left the server.`);

    await member.client.userLevels.data.findByIdAndDelete(member.id);
}
