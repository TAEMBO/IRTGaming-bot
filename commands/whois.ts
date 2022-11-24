import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';

function convert(status: string) {
	switch (status) {
		case "offline":
			return "⚫";
		case "idle":
			return "🟡";
		case "dnd":
			return "🔴";
		case "online":
			return "🟢";
	}
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
				.addFields(
					{name: '🔹 Account Creation Date', value: `<t:${Math.round(user.createdTimestamp / 1000)}>\n<t:${Math.round(user.createdTimestamp / 1000)}:R>`})
				.setColor(client.config.embedColor)
			interaction.reply({embeds: [embed]});
		} else {
			await member.user.fetch();
			const embedArray = [];
			const embed0 = new client.embed()
				.setThumbnail(member.user.avatarURL({ extension: 'png', size: 2048}) || member.user.defaultAvatarURL)
				.setTitle(`${member.user.bot ? `Bot` : 'Member'} info: ${member.user.tag}`)
				.setURL(`https://discord.com/users/${member.user.id}`)
				.setDescription(`<@${member.user.id}>\n\`${member.user.id}\`${member.user.id === interaction.guild.ownerId ? '\n__**Server Owner**__ 👑' : ''}`)
				.addFields(
				{name: '🔹 Account Creation Date', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>\n<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`},
				{name: '🔹 Join Date', value: `<t:${Math.round((member.joinedTimestamp as number) / 1000)}>\n<t:${Math.round((member.joinedTimestamp as number) / 1000)}:R>`},
				{name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== interaction.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
				.setColor(member.displayColor || client.config.embedColor)
				.setImage(member.user.bannerURL({ extension: 'png', size: 1024}) as string)
				if (member.premiumSinceTimestamp !== null) {
					embed0.addFields(
						{name: '🔹 Server Boosting Since', value: `<t:${Math.round(member.premiumSinceTimestamp / 1000)}>\n<t:${Math.round(member.premiumSinceTimestamp / 1000)}:R>`, inline: true}
					)
				}
				
				if (member.presence && !member.user.bot) {
					embed0.addFields(
						{name: `🔹 Status: ${member.presence.status}`, value: `${member.presence.status === 'offline' ? 'N/A' : `Web: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).web ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).web as string) : convert('offline')}\nMobile: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).mobile ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).mobile as string) : convert('offline')}\nDesktop: ${(member.presence.clientStatus as Discord.ClientPresenceStatusData).desktop ? convert((member.presence.clientStatus as Discord.ClientPresenceStatusData).desktop as string) : convert('offline')}`}`, inline: true}
					)
					embedArray.push(embed0);
					member.presence.activities.map((x: any) => {
						if (x.type == 2) {
							embedArray.push(
								new client.embed()
									.setTitle(x.name)
									.setColor('#1DB954')
									.addFields(
										{name: x.details, value: `By: ${x.state}\nOn: ${x.assets.largeText}\nStarted listening <t:${Math.round(x.createdTimestamp/1000)}:R>`}
									)
									.setThumbnail(`https://i.scdn.co/image/${x.assets.largeImage.replace('spotify:', '')}`)
							)
						} else if (x.type == 4) {
							embedArray.push(
								new client.embed()
									.setTitle(x.name)
									.setColor('#ffffff')
									.setDescription(`${x.emoji == null ? '' : `**Emoji name:** ${x.emoji.name}\n**Text:** `}${x.state}`)
							)
						} else {
							embedArray.push(
								new client.embed()
									.setTitle(x.name)
									.setColor('#ffffff')
									.setDescription(`\u200b**Started:** <t:${Math.round(x.createdTimestamp/1000)}:R>${x.details == null ? '' : '\n**Details:** ' + x.details}${x.state == null ? '' : '\n**State:** ' + x.state}${x.assets ? '\n**Large text:** ' + x?.assets?.largeText : ''}`)
							)
						}
					})
				} else {embedArray.push(embed0)}
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
