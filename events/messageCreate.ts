import Discord from 'discord.js';
import YClient from '../client';

export default async (client: YClient, message: Discord.Message) => {
    if ((!client.config.botSwitches.commands && !client.config.devWhitelist.includes(message.author.id)) || message.partial || message.author.bot) return;
	//   ^^^     Bot is set to ignore commands and non-dev sent a message, ignore the message.      ^^^

	const msg = message.content.toLowerCase();
	const msgarr = msg.split(' ');

	if (!message.inGuild()) {
		const guildMemberObject = (client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild).members.cache.get(message.author.id) as Discord.GuildMember;
    	(client.channels.cache.get(client.config.mainServer.channels.testing_zone) as Discord.TextChannel).send({
			content: `DM Forward <@${client.config.devWhitelist[0]}>`,
			files: message.attachments.map(x => x.url),
			embeds: [new client.embed()
				.setTitle('Forwarded DM Message')
				.setDescription(`<@${message.author.id}>`)
				.setAuthor({name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ extension: 'png'})})
				.setColor(client.config.embedColor)
				.addFields({name: 'Message Content', value: msg.length > 1024 ? msg.slice(0, 1000) + '...' : msg + '\u200b'})
				.addFields({name: 'Roles:', value: guildMemberObject.roles.cache.size > 1 ? guildMemberObject.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(guildMemberObject.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
				.setTimestamp()]
		});
    } else {
		if (message.channel.type === Discord.ChannelType.GuildStageVoice) return;
		let automodded = false;

		/* judge-your-build-event message filter; only allow messages that contain an image
		if (message.channel.id === '925500847390097461' && message.attachments.size<1 && !message.author.bot) {
			  message.delete();
		} */
	
		// useless staff ping mute
		if (message.mentions.roles.some(mentionedRole => mentionedRole.id === client.config.mainServer.roles.mpstaff)) {
			console.log(client.timeLog('\x1b[35m'), `${message.author.tag} mentioned staff role`);
			const filter = (x: any) => client.isMPStaff(x.member) && x.content.toLowerCase() === "y";
			message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"]}).then(async collected => {
				const colMsg = collected.first() as Discord.Message;
				console.log(client.timeLog('\x1b[35m'), `Received "y" from ${colMsg.author.tag}, indicating to mute`);
				try {
					await client.punishments.addPunishment('mute', { time: '5m' }, colMsg.author.id, 'Automod; Misuse of staff ping', message.author, message.member as Discord.GuildMember);
				} catch (error) {
					console.log(client.timeLog('\x1b[31m'), `Muting failed cuz:`, error);
					colMsg.react('❌');
					return;
				}
				colMsg.react('✅');
			}).catch(() => console.log(client.timeLog('\x1b[35m'), `Failed to collect "y" from staff`));
		}
	
		const Whitelist = [
			'688803177184886794', //farm-manager-chat
			'906960370919436338', //mp-action-log
			'830916009107652630', //public-admin-chat
			'733828561215029268', //mp-staff-commands
			'690549465559597127', //mp-ban-list
			'677146047868436480', //mp-admin-chat
			'828982825734504448', //mf-manager-chat
			'986969325112033330', //mf-serverlog
			'968265015595532348', //mp-manager-chat
			'979863373439184966', //war crimes
		];
		async function repeatedMessages(thresholdTime: number, thresholdAmt: number, type: string, muteTime: string, muteReason: string) {
			if (client.repeatedMessages[message.author.id]) {
				// Add this message to the list
				client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, { type, channel: message.channel.id });
	
				// Reset timeout
				clearTimeout(client.repeatedMessages[message.author.id].timeout);
				client.repeatedMessages[message.author.id].timeout = setTimeout(() => delete client.repeatedMessages[message.author.id], thresholdTime);
	
				// Message mustve been sent after (now - threshold), so purge those that were sent earlier
				client.repeatedMessages[message.author.id].data = client.repeatedMessages[message.author.id].data.filter((x, i) => i >= Date.now() - thresholdTime)
	
				// A spammed message is one that has been sent within the threshold parameters
				const spammedMessage = client.repeatedMessages[message.author.id].data.find(x => {
					return client.repeatedMessages[message.author.id].data.filter(y => x.type === y.type).size >= thresholdAmt;
				});
	
				if (spammedMessage) {
					delete client.repeatedMessages[message.author.id];
					await client.punishments.addPunishment('mute', { time: muteTime }, (client.user as Discord.User).id, `Automod; ${muteReason}`, message.author, message.member as Discord.GuildMember);
				}
			} else {
				client.repeatedMessages[message.author.id] = { data: new client.collection(), timeout: setTimeout(() => delete client.repeatedMessages[message.author.id], thresholdTime) };
				client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, { type, channel: message.channel.id });
			}
		}

		// RepeatedMessages
		if (client.config.botSwitches.automod && !client.hasModPerms(message.member as Discord.GuildMember)) {
			if (client.bannedWords._content.some(x => msgarr.includes(x)) && !Whitelist.includes(message.channel.id)) { // Banned words
				automodded = true;
				message.delete();
				message.channel.send('That word is banned here.').then(x => setTimeout(() => x.delete(), 5000));
				await repeatedMessages(30000, 4, 'bw', '30m', 'Banned words');
			} else if (msg.includes("discord.gg/") && !client.isMPStaff(message.member as Discord.GuildMember)) { // Discord advertisement
				const inviteURL = msgarr.find(x => x.includes('discord.gg/')) as string;
				const validInvite = await client.fetchInvite(inviteURL).catch(() => undefined);
				if (validInvite && validInvite.guild?.id !== client.config.mainServer.id) {
					automodded = true;
					message.delete();
					message.channel.send("No advertising other Discord servers.").then(x => setTimeout(() => x.delete(), 10000));
					await repeatedMessages(60000, 2, 'adv', '1h', 'Discord advertisement');
				}
			}
		}
	
		if (message.channel.id !== '557692151689904129' && !automodded) client.userLevels.incrementUser(message.author.id);
			
		// Morning message system
		const person = message.member?.displayName;
		const morningMsgs = [ 'morning all', 'morning everyone', 'morning guys', 'morning people' ];
		const mornRes1 = [ `Wakey wakey ${person}! `, `Morning ${person}! `, `Why good morning ${person}! `, `Rise and shine ${person}! `, `Up and at 'em ${person}! `];
		const mornRes2 = [
			'Here, take a pancake or two 🥞',
			'Here, take a 🥔',
			'Here, take a cookie 🍪',
			'Fancy a piece of pizza? Here you go 🍕',
			'I have no movie, but I have some popcorn! Here you go 🍿',
			'It\'s a bit stale but enjoy 🍞',
			'Don\'t fall out of bed!',
			'Coffee\'s gonna be a little late this morning.',
			'Tea\'s gonna be a little late this morning.',
			'Did you have a good dream?',
			'<a:IRT_DogWave:716263418495238215>',
			'<:IRT_GoodMorning:605524803008593920>',
			'I hope you have a good day today sweetie!',
			'Here\'s some wheat to make some bread that\'s not stale <:IRT_Wheat:761356327708131329>',
			'I have a movie this time! Sync Sim 22, a real good one.',
			'Is it Friday yet?',
			'Did you sleep on the cold side of the pillow?',
			'I have a sausage roll for you! <:IRT_Sausageroll:666726520701845534>',
			''
		];
	
		if (client.config.botSwitches.autoResponses && !automodded) { // Auto responses
			if (morningMsgs.some(x => msg.includes(x)) && message.channel.id == '552565546093248512') message.reply({ content: mornRes1[Math.floor(Math.random() * mornRes1.length)] + mornRes2[Math.floor(Math.random() * mornRes2.length)], allowedMentions: { repliedUser: false } });
			
			if (msg.includes('giants moment')) message.react('™️');
			
			if (msg.includes('sync sim')) message.react(':IRT_SyncSim22:929440249577365525');
			
			if (msg.includes('smoker')) message.react('🚭');
			
			if (msg.includes("forgor")) message.react("💀");
			
			if (msgarr.includes('69')) message.react(':IRT_Noice:611558357643558974');
			
			if (msg.startsWith('!rank')) message.reply({content: 'Ranking has been moved to </rank view:1042659197919178790>', allowedMentions: {repliedUser: false}});
		}
	}
}
