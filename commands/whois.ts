import Discord, { APIEmbedField, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import { ApplicationRPC } from '../typings.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        async function getApplicationData(id: string) {
            const applicationData = await client.rest.get(`/applications/${id}/rpc`).catch(() => null) as ApplicationRPC | null;
            const fields: APIEmbedField[] = [];

            if (!applicationData) return;

            if (applicationData.description) fields.push({ name: '🔹 Bot description', value: applicationData.description });

            if (applicationData.tags?.length) fields.push({ name: '🔹 Bot tags', value: applicationData.tags.map(x => `\`${x}\``).join() });

            if (applicationData.flags) fields.push({ name: '🔹 Bot flags', value: new Discord.ApplicationFlagsBitField(applicationData.flags).toArray().map(x => `\`${x}\``).join() });

            fields.push({ name: '🔹 Bot is public', value: applicationData.bot_public ? 'Yes' : 'No' });

            return fields;
        }
        
        function convertStatus(status?: Discord.ClientPresenceStatus) {
            return {
                idle: "🟡",
                dnd: "🔴",
                online: "🟢",
                invisible: "⚫"
            }[status ?? 'invisible'];
        }

		const member = interaction.options.getMember("member");

		if (!member) {
			const user = interaction.options.getUser('member', true);
            const appData = await getApplicationData(user.id);
            const embed = new client.embed()
                .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 2048 }))
                .setTitle(`${user.bot ? 'Bot' : 'User'} info: ${user.tag}`)
                .setURL(`https://discord.com/users/${user.id}`)
                .setDescription(`<@${user.id}>\n\`${user.id}\``)
                .addFields({ name: '🔹 Account Created', value: `<t:${Math.round(user.createdTimestamp / 1000)}:R>` })
                .setColor(client.config.embedColor);

            if (appData) embed.addFields(...appData);

			interaction.reply({ embeds: [embed] });
		} else {
			await member.user.fetch();
			const embeds: EmbedBuilder[] = [];
			let titleText = 'Member';

			if (member.user.bot) {
				titleText = 'Bot';
			} else if (member.user.id === interaction.guild.ownerId) titleText = ':crown: Server Owner';
			
			embeds.push(new client.embed()
				.setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }))
				.setTitle(`${titleText} info: ${member.user.tag}`)
				.setURL(`https://discord.com/users/${member.user.id}`)
				.setDescription(`<@${member.user.id}>\n\`${member.user.id}\``)
				.addFields(
					{ name: '🔹 Account created', value: `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>` },
					{ name: '🔹 Joined Server', value: `<t:${Math.round(member.joinedTimestamp as number / 1000)}:R>` },
					{ name: `🔹 Roles: ${member.roles.cache.size - 1}`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== interaction.guildId).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None' })
				.setColor(member.displayColor || '#ffffff')
				.setImage(member.user.bannerURL({ extension: 'png', size: 1024 }) ?? null)
            );

			if (member.premiumSinceTimestamp) embeds[0].addFields({ name: '🔹 Server Boosting Since', value: `<t:${Math.round(member.premiumSinceTimestamp / 1000)}:R>`, inline: true });
			
            if (member.user.bot) {
                const appData = await getApplicationData(member.user.id);

                if (appData) embeds[0].addFields(...appData);

                return interaction.reply({ embeds });
            }

            if (!member.presence) return interaction.reply({ embeds });

            embeds[0].addFields({
                name: `🔹 Status: ${member.presence.status}`,
                value: `${member.presence.status === 'offline' ? '\u200b' : [
                    `Web: ${convertStatus(member.presence.clientStatus?.web)}`,
                    `Mobile: ${convertStatus(member.presence.clientStatus?.mobile)}`,
                    `Desktop: ${convertStatus(member.presence.clientStatus?.desktop)}`
                ].join('\n')}`,
                inline: true
            });

            for (const activity of member.presence.activities) {
                if (activity.type === 2 && activity.details && activity.assets) {
					embeds.push(new client.embed()
						.setAuthor({ name: activity.name, iconURL: 'https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-icon-marilyn-scott-0.png' })
						.setColor('#1DB954')
						.setFields({ name: activity.details, value: `By: ${activity.state}\nOn: ${activity.assets.largeText}\nStarted listening <t:${Math.round(activity.createdTimestamp / 1000)}:R>` })
						.setThumbnail(`https://i.scdn.co/image/${activity.assets.largeImage?.replace('spotify:', '')}`)
                    );
				} else if (activity.type === 4) {
					embeds.push(new client.embed()
						.setTitle(activity.name)
						.setColor('#ffffff')
						.setDescription([
							activity.emoji ? `**Emoji name:** ${activity.emoji.name}`: '',
							activity.state ? `\n**Text:** ${activity.state}`: ''
						].join(''))
                    );
				} else {
					let activityImage: string[] | string | null | undefined = [
						['542474758835535872', 'https://cdn.discordapp.com/app-icons/542474758835535872/37b18c2d5633628d936dd3b2b083785b.png'], // Farming Simulator 19
						['363426921612181504', 'https://cdn.discordapp.com/app-icons/363426921612181504/61bed87d2da8e32dd8f24423a9e83323.png'], // Farming Simulator 17
						['732565262704050298', `https://cdn.discordapp.com/app-assets/732565262704050298/${activity.assets?.largeImage}.png`], // Visual Studio Code
						['383226320970055681', `https://cdn.discordapp.com/app-assets/383226320970055681/${activity.assets?.largeImage}.png`], // Visual Studio Code
						['356875570916753438', 'https://cdn.discordapp.com/app-icons/356875570916753438/166fbad351ecdd02d11a3b464748f66b.png'], // Minecraft
						['438122941302046720', 'https://discord.com/assets/29b4af8bf13fa73258692008d25b4f0d.png'], // Any Xbox status
						['356876176465199104', 'https://cdn.discordapp.com/app-icons/356876176465199104/069d9f4871b5ebd2f62bd342ce6ba77f.png'], // Grand Theft Auto V
						['363445589247131668', 'https://cdn.discordapp.com/app-icons/363445589247131668/f2b60e350a2097289b3b0b877495e55f.png'], // Roblox
						['356876590342340608', 'https://cdn.discordapp.com/app-icons/356876590342340608/554af7ef210877b5f04fd1b727a3746e.png'], // Rainbow Six Siege
						['445956193924546560', `https://cdn.discordapp.com/app-assets/445956193924546560/${activity.assets?.largeImage}.png`], // Rainbow Six Siege again
					].find(x => x[0] === activity.applicationId);

					if (activityImage) activityImage = activityImage[1]; // If a URL was found in the array, choose the URL string in the array
					if (!activityImage) activityImage = activity.assets?.largeImageURL(); // Struggle with PlayStation presence images
					if (!activityImage) activityImage = activity.assets?.smallImageURL(); // Anything extra

					embeds.push(new client.embed()
						.setTitle(activity.name)
						.setColor('#ffffff')
						.setDescription([
							`\u200b**Started:** <t:${Math.round(activity.createdTimestamp/1000)}:R>`,
							activity.details ? '\n**Details:** ' + activity.details : '',
							activity.state ? '\n**State:** ' + activity.state : '',
							activity.assets?.largeText ? '\n**Large text:** ' + activity.assets.largeText : '',
							activity.assets?.smallText ? '\n**Small text:** ' + activity.assets.smallText : ''
						].join(''))
						.setThumbnail(activityImage ?? null)
					);
				}
            }
            
			interaction.reply({ embeds });
		}
	},
	data: new SlashCommandBuilder()
		.setName("whois")
		.setDescription("Get info on a member or user")
		.addUserOption(x=>x
			.setName("member")
			.setDescription("The member or user to get info on")
			.setRequired(true))
};
