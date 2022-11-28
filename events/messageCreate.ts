import Discord from 'discord.js';
import YClient from '../client';

export default {
    name: "messageCreate",
    execute: async (client: YClient, message: Discord.Message) => {
    	if ((!client.config.botSwitches.commands && !client.config.devWhitelist.includes(message.author.id)) || message.partial || message.author.bot) return;
		//   ^^^     Bot is set to ignore commands and non-dev sent a message, ignore the message.      ^^^

		if (message.channel.type == 1) {
    	    if (client.games.some((x: string) => x === message.author.tag)) return;
    	    const channel = client.channels.cache.get(client.config.mainServer.channels.testing_zone) as Discord.TextChannel;
    	    const guildMemberObject = (client.guilds.cache.get(client.config.mainServer.id) as Discord.Guild).members.cache.get(message.author.id) as Discord.GuildMember;
    	    const embed = new client.embed()
    	        .setTitle('Forwarded DM Message')
    	        .setDescription(`<@${message.author.id}>`)
    	        .setAuthor({name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ extension: 'png'})})
    	        .setColor(client.config.embedColor)
    	        .addFields({name: 'Message Content', value: message.content.length > 1024 ? message.content.slice(1021) + '...' : message.content + '\u200b'})
     	    	.setTimestamp();
     	   	let messageAttachmentsText = '';
        	message.attachments.forEach((attachment: Discord.Attachment) => {
    	        if (!embed.data.image && ['png', 'jpg', 'webp', 'gif', 'jpeg'].some(x => ((attachment as Discord.Attachment).name as string).endsWith(x))) embed.setImage(attachment.url);
    	        else messageAttachmentsText += `[${attachment.name}](${attachment.url})\n`;
    	    });
    	    if (messageAttachmentsText.length > 0) embed.addFields({name: 'Message Attachments', value: messageAttachmentsText.trim()});
        	embed.addFields({name: 'Roles:', value: guildMemberObject.roles.cache.size > 1 ? guildMemberObject.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(guildMemberObject.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
        	channel.send({content: `DM Forward <@${client.config.devWhitelist[0]}>`, embeds: [embed]});
    	}
		if (!message.guild) return;
		const msg = message.content.toLowerCase();
		const msgarr = msg.split(' ');
		let automodded = false;
	
		/* judge-your-build-event message filter; only allow messages that contain an image
		if (message.channel.id === '925500847390097461' && message.attachments.size<1 && !message.author.bot) {
		  	message.delete();
		} */

		// useless staff ping mute
		if (message.mentions.roles.some(mentionedRole => mentionedRole.id === client.config.mainServer.roles.mpstaff)) {
			console.log(`[${client.moment().format('HH:mm:ss')}]`, `${message.author.tag} mentioned staff role`);
			const filter = (x: any) => client.isMPStaff(x.member) && x.content.toLowerCase() === "y";
			message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"]}).then(async collected => {
				console.log(`[${client.moment().format('HH:mm:ss')}]`, `Received "y" from ${(collected.first() as Discord.Message).author.tag}, indicating to mute`);
				try {
					const muteResult = await client.punishments.addPunishment('mute', { time: '5m' }, (collected.first() as Discord.Message).author.id, 'Automod; Misuse of staff ping', message.author, message.member as Discord.GuildMember);
				} catch (error) {
					console.log(`[${client.moment().format('HH:mm:ss')}]`, `Muting failed cuz:`, error);
				}
				(collected.first() as Discord.Message).react('✅');
			}).catch(() => console.log(`[${client.moment().format('HH:mm:ss')}]`, `Failed to collect "y" from staff`));
		}

		function onTimeout() {
			delete client.repeatedMessages[message.author.id];
		}

		// repeated messages; banned words
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

		if (client.bannedWords._content.some((x: string) => msgarr.includes(x)) && !client.hasModPerms(message.member as Discord.GuildMember) && !Whitelist.includes(message.channel.id) && client.config.botSwitches.automod) {
			automodded = true;
			message.delete();
			message.channel.send('That word is banned here.').then(x => setTimeout(() => x.delete(), 5000));
			if (client.repeatedMessages[message.author.id]) {
				// add this message to the list
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: 0, ch: message.channel.id });

				// reset timeout
				clearTimeout(client.repeatedMessages[message.author.id].to);
				client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 30000);

				// this is the time in which 4 messages have to be sent, in milliseconds
				const threshold = 30000;

				// message mustve been sent after (now - threshold), so purge those that were sent earlier
				client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x: any, i: number) => i >= Date.now() - threshold)

				// a spammed message is one that has been sent at least 4 times in the last threshold milliseconds
				const spammedMessage = client.repeatedMessages[message.author.id]?.find((x: any) => {
					return client.repeatedMessages[message.author.id].filter((y: any) => x.cont === y.cont).size >= 4;
				});

				// if a spammed message exists;
				if (spammedMessage) {
					// mute
					const muteResult = await client.punishments.addPunishment('mute', { time: '30m' }, (client.user as Discord.User).id, 'Automod; Banned words', message.author, message.member as Discord.GuildMember);

					// and clear their list of long messages
					delete client.repeatedMessages[message.author.id];
				}
			} else {
				client.repeatedMessages[message.author.id] = new client.collection();
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: 0, ch: message.channel.id });

				// auto delete after 30 seconds
				client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 30000);
			}
		}

		// repeated messages; Discord advertisement
		if (message.content.includes("discord.gg/") && !client.hasModPerms(message.member as Discord.GuildMember) && !client.isMPStaff(message.member as Discord.GuildMember) && client.config.botSwitches.automod) {
			automodded = true;
			message.delete();
			message.channel.send("No advertising other Discord servers.").then(x => setTimeout(() => x.delete(), 10000))
			if (client.repeatedMessages[message.author.id]) {
				// add this message to the list
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: 1, ch: message.channel.id });

				// reset timeout
				clearTimeout(client.repeatedMessages[message.author.id].to);
				client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 60000);

				// this is the time in which 2 messages have to be sent, in milliseconds
				const threshold = 60000;

				// message mustve been sent after (now - threshold), so purge those that were sent earlier
				client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x: any, i: number) => i >= Date.now() - threshold)

				// a spammed message is one that has been sent at least 2 times in the last threshold milliseconds
				const spammedMessage = client.repeatedMessages[message.author.id]?.find((x: any) => {
					return client.repeatedMessages[message.author.id].filter((y: any) => x.cont === y.cont).size >= 2;
				});

				// if a spammed message exists;
				if (spammedMessage) {
					// mute
					const muteResult = await client.punishments.addPunishment('mute', { time: '1h' }, (client.user as Discord.User).id, 'Automod; Discord advertisement', message.author, message.member as Discord.GuildMember);

					// and clear their list of long messages
					delete client.repeatedMessages[message.author.id];
				}
			} else {
				client.repeatedMessages[message.author.id] = new client.collection();
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: 1, ch: message.channel.id });

				// auto delete after 1 minute
				client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 60000);
			}
		}

		// if message was sent in a whitelisted channel, count towards user level
		if (message.channel.id != '557692151689904129' && !automodded) {
			client.userLevels.incrementUser(message.author.id)
		};
		
		// Morning message system
		const morningMsgs = [
			'morning all',
			'morning everyone',
			'morning guys',
			'morning people'
		];
		const person = message.member?.displayName;
		const morningResponses1 = [
			`Wakey wakey ${person}! `,
			`Morning ${person}! `,
			`Why good morning ${person}! `,
			`Rise and shine ${person}! `
		]
		const morningResponses2 = [
			'Here, take a pancake or two 🥞',
			'Here, take a 🥔',
			'Here, take a cookie 🍪',
			'Fancy a piece of pizza? Here you go 🍕',
			'I have no movie, but I have some popcorn! Here you go 🍿',
			'It\'s a bit stale but enjoy 🍞',
			'Don\'t fall out of bed!',
			'Coffee\'s gonna be a little late this morning.',
			'Tea\'s gonna be a little late this morning.',
			'Or is this all a dream still...',
			'Did you have a good dream?',
			'<a:IRT_DogWave:716263418495238215>',
			'<:IRT_GoodMorning:605524803008593920>',
			'Here\'s some wheat to make some bread that\'s not stale <:IRT_Wheat:761356327708131329>',
			'I have a movie this time! Sync Sim 22, a real good one.',
			'Is it Friday yet?',
			'Leggo my Eggo? <:IRT_LegoThink:590629971144474644>',
			'I hope you have a good day today sweetie!',
			'Did you sleep on the cold side of the pillow?',
			'~~I have free Discord Nitro for you!~~',
			''
		];

		if (client.config.botSwitches.autoResponses && !automodded) { // auto responses
			if (morningMsgs.some((x) => msg.includes(x)) && message.channel.id == '552565546093248512') {
				message.reply({content: `${morningResponses1[Math.floor(Math.random() * morningResponses1.length)]}${morningResponses2[Math.floor(Math.random() * morningResponses2.length)]}${message.author.id == '207828776262828034' ? ' https://tenor.com/view/alan-animal-prairie-dog-gif-13203931' : ''}`, allowedMentions: {repliedUser: false}})
			}
			if (msg.includes('giants moment')) {
				message.react('™️');
			}
			if (msg.includes('sync sim')) {
				message.react(':IRT_SyncSim22:929440249577365525')
			}
			if (msg.includes('smoker')) {
				message.react('🚭')
			}
			if (msg.includes("forgor")) {
				message.react("💀")
			}
			if (msgarr.includes('69')) {
				message.react(':IRT_Noice:611558357643558974')
			}
			if (message.content.startsWith('!rank')) {
				message.reply({content: 'Ranking has been moved to </rank view:1042659197919178790>', allowedMentions: {repliedUser: false}})
			}
		}
}
}
