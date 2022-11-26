import Discord from 'discord.js';
import YClient from '../client';

export default {
    name: "guildMemberRemove",
    execute: async (client: YClient, member: Discord.GuildMember) => {
        if (!client.config.botSwitches.logs || !member.joinedTimestamp) return;

        const logChannel = client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel;
        const embed = new client.embed()
            .setTitle(`Member Left: ${member.user.tag}`)
            .setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
            .addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>\n<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`},
            {name: '🔹 Server Join Date', value: `<t:${Math.round(member.joinedTimestamp / 1000)}>\n<t:${Math.round(member.joinedTimestamp / 1000)}:R>`},
            {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter((x) => x.id !== member.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'}`, inline: true},
            {name: '🔹 Ranking Total', value: `${client.userLevels._content[member.user.id]?.messages.toLocaleString('en-US') || 0}`, inline: true})
            .setColor(client.config.embedColorRed)
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048}) || member.user.defaultAvatarURL);
        logChannel.send({embeds: [embed]});
        delete client.userLevels._content[member.user.id]; // Delete their ranking data
    }
}
