import Discord from 'discord.js';
import YClient from '../client';

export default {
    name: "guildMemberRemove",
    execute: async (client: YClient, member: Discord.GuildMember) => {
        if (!client.config.botSwitches.logs) return;
        if (!member.joinedTimestamp) return;

        const embed = new client.embed();
            embed.setTitle(`Member Left: ${member.user.tag}`);
            embed.setDescription(`<@${member.user.id}>\n\`${member.user.id}\``);
            embed.addFields(
            {name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>\n<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`},
            {name: '🔹 Join Date', value: `<t:${Math.round(member.joinedTimestamp / 1000)}>\n<t:${Math.round(member.joinedTimestamp / 1000)}:R>`},
            {name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: `${member.roles.cache.size > 1 ? member.roles.cache.filter((x) => x.id !== member.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'}`, inline: true},
            {name: '🔹 Level Roles messages', value: `${client.userLevels._content[member.user.id]?.messages.toLocaleString('en-US') || 0}`, inline: true});
            embed.setColor(client.config.embedColorRed);
            embed.setTimestamp();
            embed.setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048}) as string);
         (client.channels.resolve(client.config.mainServer.channels.botlogs) as Discord.TextChannel).send({embeds: [embed]});
         delete client.userLevels._content[member.user.id];
    }
}
