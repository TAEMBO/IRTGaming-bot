import Discord, { Activity, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import YClient from '../client';

function convertStatus(status?: string) {
	if (status) {
		switch (status) {
			case "idle":
				return "🟡";
			case "dnd":
				return "🔴";
			case "online":
				return "🟢";
		}
	} else {
		return '⚫';
	}
}
function formatTime(timestamp: number) {
	return `<t:${Math.round(timestamp / 1000)}>\n<t:${Math.round(timestamp / 1000)}:R>`;
}
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const member = interaction.options.getMember("member") as Discord.GuildMember;
		if (member == null) {
			const user = interaction.options.getUser('member') as Discord.User;

			const embed = new client.embed()
				.setThumbnail(user.avatarURL({ extension: 'png', size: 2048}) || user.defaultAvatarURL)
				.setTitle(`${user.bot ? 'Bot' : 'User'} info: ${user.tag}`)
				.setURL(`https://discord.com/users/${user.id}`)
				.setDescription(`<@${user.id}>\n\`${user.id}\``)
				.addFields({name: '🔹 Account Creation Date', value: formatTime(user.createdTimestamp)})
				.setColor(client.config.embedColor)
			interaction.reply({embeds: [embed]});
		} else {
			await member.user.fetch();
			const embedArray: Array<EmbedBuilder> = [];
			const embed0 = new client.embed()
				.setThumbnail(member.user.avatarURL({ extension: 'png', size: 2048}) || member.user.defaultAvatarURL)
				.setTitle(`${member.user.bot ? `Bot` : 'Member'} info: ${member.user.tag}`)
				.setURL(`https://discord.com/users/${member.user.id}`)
				.setDescription(`<@${member.user.id}>\n\`${member.user.id}\`${member.user.id === interaction.guild.ownerId ? '\n__**Server Owner**__ 👑' : ''}`)
				.addFields(
					{name: '🔹 Account Creation Date', value: formatTime(member.user.createdTimestamp)},
					{name: '🔹 Join Date', value: formatTime(member.joinedTimestamp as number)},
					{name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== interaction.guild.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
				.setColor(member.displayColor || '#ffffff')
				.setImage(member.user.bannerURL({ extension: 'png', size: 1024}) as string)
			if (member.premiumSinceTimestamp) embed0.addFields({name: '🔹 Server Boosting Since', value: formatTime(member.premiumSinceTimestamp), inline: true});
				
			if (member.presence && !member.user.bot) {
				const presenceStatus = member.presence.clientStatus as Discord.ClientPresenceStatusData;
				embed0.addFields({name: `🔹 Status: ${member.presence.status}`, value: `${member.presence.status === 'offline' ? '\u200b' : `Web: ${convertStatus(presenceStatus.web)}\nMobile: ${convertStatus(presenceStatus.mobile)}\nDesktop: ${convertStatus(presenceStatus.desktop)}`}`, inline: true})
				embedArray.push(embed0);
				member.presence.activities.map((activity: Activity) => {
					if (activity.type == 2 && activity.details && activity.assets) {
						embedArray.push(new client.embed()
							.setAuthor({name: activity.name, iconURL: 'https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-icon-marilyn-scott-0.png'})
							.setColor('#1DB954')
							.addFields({name: activity.details, value: `By: ${activity.state}\nOn: ${activity.assets.largeText}\nStarted listening <t:${Math.round(activity.createdTimestamp/1000)}:R>`})
							.setThumbnail(`https://i.scdn.co/image/${activity.assets.largeImage?.replace('spotify:', '')}`)
						)
					} else if (activity.type == 4) {
						embedArray.push(new client.embed()
							.setTitle(activity.name)
							.setColor('#ffffff')
							.setDescription([
								activity.emoji ? `**Emoji name:** ${activity.emoji.name}`: '',
								activity.state ? `\n**Text:** ${activity.state}`: ''
							].join(''))
						)
					} else {
						embedArray.push(new client.embed()
							.setTitle(activity.name)
							.setColor('#ffffff')
							.setDescription([
								`\u200b**Started:** <t:${Math.round(activity.createdTimestamp/1000)}:R>`,
								activity.details ? '\n**Details:** ' + activity.details : '',
								activity.state ? '\n**State:** ' + activity.state : '',
								activity.assets ? '\n**Large text:** ' + activity.assets.largeText : ''
							].join(''))
						)
					}
				})
			} else embedArray.push(embed0);

			interaction.reply({embeds: embedArray});
		}
	},
	data: new SlashCommandBuilder()
		.setName("whois")
		.setDescription("Get info on a member or user.")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("The member or user to get info on.")
			.setRequired(true))
};
