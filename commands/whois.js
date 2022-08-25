const {SlashCommandBuilder} = require('discord.js');

function convert(status) {
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
module.exports = {
	run: async (client, interaction, user) => {
		const subCmd = interaction.options.getSubcommand();

		if (subCmd === 'member') {
			const member = interaction.options.getMember("member");
			await member.user.fetch();
			const embedArray = [];
			const embed0 = new client.embed()
				.setThumbnail(member.user.avatarURL({ format: 'png', dynamic: true, size: 2048}) || member.user.defaultAvatarURL)
				.setTitle(`${member.user.bot ? `Bot` : 'Member'} info: ${member.user.tag}`)
				.setURL(`https://discord.com/users/${member.user.id}`)
				.setDescription(`<@${member.user.id}>\n\`${member.user.id}\`${member.user.id === interaction.guild.ownerId ? '\n__**Server Owner**__ 👑' : ''}`)
				.addFields(
				{name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.user.createdTimestamp) / 1000)}:R>`},
				{name: '🔹 Join Date', value: `<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.joinedTimestamp) / 1000)}:R>`},
				{name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== interaction.guild.roles.everyone.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
				.setColor(member.displayColor || client.config.embedColor)
				.setImage(member.user.bannerURL({ format: 'png', dynamic: true, size: 1024}))
				if (member.premiumSinceTimestamp !== null) {
					embed0.addFields(
						{name: '🔹 Server Boosting Since', value: `<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}>\n<t:${Math.round(new Date(member.premiumSinceTimestamp) / 1000)}:R>`, inline: true}
					)
				}
				
				if (member.presence && !member.user.bot) {
					embed0.addFields(
						{name: `🔹 Status: ${member.presence.status}`, value: `${member.presence.status === 'offline' ? 'N/A' : `Web: ${member.presence.clientStatus.web ? convert(member.presence.clientStatus.web) : convert('offline')}\nMobile: ${member.presence.clientStatus.mobile ? convert(member.presence.clientStatus.mobile) : convert('offline')}\nDesktop: ${member.presence.clientStatus.desktop ? convert(member.presence.clientStatus.desktop) : convert('offline')}`}`, inline: true}
					)
					embedArray.push(embed0);
					member.presence.activities.map((x) => {
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
									.setDescription(`\u200b${x.details == null ? '' : '\n**Details:** ' + x.details}${x.state == null ? '' : '\n**State:** ' + x.state}${x.assets ? '\n**Large text:** ' + x?.assets?.largeText : ''}\n**Started:** <t:${Math.round(x.createdTimestamp/1000)}:R>`)
							)
						}
					})
				} else {embedArray.push(embed0)}
			interaction.reply({embeds: embedArray});
		} else if (subCmd === 'user') {
			let error = false;
			const User = await client.users.fetch(interaction.options.getString("user"), [force = true]).catch((e) => error = true);
			if (error) return interaction.reply('A user with that ID could not be found');

			const embed1 = new client.embed()
				.setThumbnail(User.avatarURL({ format: 'png', dynamic: true, size: 2048}) || User.defaultAvatarURL)
				.setTitle(`${User.bot ? 'Bot' : 'User'} info: ${User.tag}`)
				.setURL(`https://discord.com/users/${User.id}`)
				.setDescription(`<@${User.id}>\n\`${User.id}\``)
				.addFields(
				{name: '🔹 Account Creation Date', value: `<t:${Math.round(new Date(User.createdTimestamp) / 1000)}>\n<t:${Math.round(new Date(User.createdTimestamp) / 1000)}:R>`})
				.setColor(client.config.embedColor)
			interaction.reply({embeds: [embed1]});
		}
	},
	data: new SlashCommandBuilder()
		.setName("whois")
		.setDescription("Get info on a member or user.")
		.addSubcommand((optt)=>optt
			.setName('member')
			.setDescription('Get info on a member.')
			.addUserOption((opt)=>opt
				.setName("member")
				.setDescription("The member to get info on.")
				.setRequired(true)))
		.addSubcommand((optt)=>optt
			.setName('user')
			.setDescription('Get info on a user')
			.addStringOption((opt)=>opt
				.setName("user")
				.setDescription("The ID of the user.")
				.setRequired(true)))
};
