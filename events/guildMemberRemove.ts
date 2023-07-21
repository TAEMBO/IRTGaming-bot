import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, member: Discord.GuildMember) => {
    if (!client.config.botSwitches.logs || !member.joinedTimestamp) return;
        
    const rankingData = await client.userLevels._content.findById(member.id);
    const embed = new EmbedBuilder()
        .setTitle(`Member Left: ${member.user.tag}`)
        .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
        .addFields(
            { name: '🔹 Account Created', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
            { name: '🔹 Joined server', value: `<t:${Math.round(member.joinedTimestamp / 1000)}:R>` },
            { name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None', inline: true })
        .setTimestamp()
        .setColor(client.config.embedColorRed)
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }));

    if (rankingData && rankingData.messages) embed.addFields({ name: '🔹 Ranking Total', value: rankingData.messages.toLocaleString('en-US'), inline: true });

    client.getChan('botLogs').send({ embeds: [embed] });
    
    client.getChan('leaveLogs').send(`**${member.user.tag}** left the server.`);

    await client.userLevels._content.findByIdAndDelete(member.id);
}
