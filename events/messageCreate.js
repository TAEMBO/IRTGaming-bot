const {ChannelType} = require('discord.js');

module.exports = {
    name: "messageCreate",
    execute: async (client, message) => {
    	if (!client.config.botSwitches.commands && !client.config.devWhitelist.includes(message.author.id)) return; // bot is being run in dev mode and a non eval whitelisted user sent a message. ignore the message.
		if (message.partial) return;
		if (message.author.bot) return;
		if (message.channel.type === ChannelType.DM) {
    	    if (client.dmForwardBlacklist._content.includes(message.author.id)) return;
    	    if (client.games.some(x => x === message.author.tag)) return;
    	    const channel = client.channels.cache.get(client.config.mainServer.channels.testing_zone);
			const irt = client.guilds.cache.get(client.config.mainServer.id);
    	    const guildMemberObject = await irt?.members.cache.get(message.author.id);
    	    const embed = new client.embed()
    	        .setTitle('Forwarded DM Message')
    	        .setDescription(`<@${message.author.id}>`)
    	        .setAuthor({name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ format: 'png', dynamic: true})})
    	        .setColor(client.config.embedColor)
    	        .addFields({name: 'Message Content', value: message.content.length > 1024 ? message.content.slice(1021) + '...' : message.content + '\u200b'})
     	    	.setTimestamp();
     	   	let messageAttachmentsText = '';
        	message.attachments.forEach(attachment => {
    	        if (!embed.image && ['png', 'jpg', 'webp', 'gif', 'jpeg'].some(x => attachment.name.endsWith(x))) embed.setImage(attachment.url);
    	        else messageAttachmentsText += `[${attachment.name}](${attachment.url})\n`;
    	    });
    	    if (messageAttachmentsText.length > 0) embed.addFields({name: 'Message Attachments', value: messageAttachmentsText.trim()});
        	embed.addFields({name: 'Roles:', value: guildMemberObject.roles.cache.size > 1 ? guildMemberObject.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(guildMemberObject.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
        	channel.send({content: `DM Forward <@${client.config.devWhitelist[0]}>`, embeds: [embed], allowedMentions: {roles: true}});
    	}
		if (!message.guild) return;
		const msgarr = message.content.toLowerCase().split(' ');
		let automodded = false;
	
		/* judge-your-build-event message filter; only allow messages that contain an image
		if (message.channel.id === '925500847390097461' && message.attachments.size<1 && !message.author.bot) {
		  	message.delete();
		} */

		// useless staff ping mute
		if (message.mentions.roles.some(mentionedRole => mentionedRole.id === client.config.mainServer.roles.mpstaff)) {
			console.log(`\x1b[36m[${client.moment().format('HH:mm:ss')}]`, `\x1b[33m${message.author.tag} mentioned staff role`);
			const filter = x => client.isMPStaff(x.member) && x.content.toLowerCase() === "y";
			message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"]}).then(async collected => {
				console.log(`\x1b[36m[${client.moment().format('HH:mm:ss')}]`, `\x1b[33mReceived "y" from ${collected.first().author.tag}, indicating to mute`);
				try {
					const muteResult = await client.punishments.addPunishment("mute", message.member, { time: "5m", reason: "Automod; misuse of staff ping", message: message}, collected.first().author.id);
				} catch (error) {
					console.log(`\x1b[36m[${client.moment().format('HH:mm:ss')}]`, `\x1b[31mMuting failed cuz:`, error);
				}
				collected.first().react('✅');
			}).catch(() => console.log(`\x1b[36m[${client.moment().format('HH:mm:ss')}]`, `\x1b[33mFailed to collect "y" from staff`));
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

		if (client.bannedWords._content.some(x => msgarr.includes(x)) && !client.hasModPerms(message.member) && !Whitelist.includes(message.channel.id) && client.config.botSwitches.automod) {
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
				client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x, i) => i >= Date.now() - threshold)

				// a spammed message is one that has been sent at least 4 times in the last threshold milliseconds
				const spammedMessage = client.repeatedMessages[message.author.id]?.find(x => {
					return client.repeatedMessages[message.author.id].filter(y => x.cont === y.cont).size >= 4;
				});

				// if a spammed message exists;
				if (spammedMessage) {
					// mute
					const muteResult = await client.punishments.addPunishment("mute", message.member, { reason: "Automod; banned words", time: '30m' }, client.user.id);

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
		if (message.content.includes("discord.gg/") && !client.hasModPerms(message.member) && !client.isMPStaff(message.member) && client.config.botSwitches.automod) {
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
				client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x, i) => i >= Date.now() - threshold)

				// a spammed message is one that has been sent at least 2 times in the last threshold milliseconds
				const spammedMessage = client.repeatedMessages[message.author.id]?.find(x => {
					return client.repeatedMessages[message.author.id].filter(y => x.cont === y.cont).size >= 2;
				});

				// if a spammed message exists;
				if (spammedMessage) {
					// mute
					const muteResult = await client.punishments.addPunishment("mute", message.member, { reason: "Automod; Discord advertisement", time: '1h' }, client.user.id);

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
	
		if (client.config.botSwitches.autoResponses && !automodded) { // auto responses
			/*if (message.content.toLowerCase().includes('morning all') || message.content.toLowerCase().includes('morning everyone')) {
			message.reply(`Morning ${message.member.displayName}!`)
			}*/
			if (message.content.toLowerCase().includes('giants moment')) {
				message.react('™️');
			}
			if (message.content.toLowerCase().includes('sync sim')) {
				message.react(':IRT_SyncSim22:929440249577365525')
			}
			if (message.content.toLowerCase().includes('smoker')) {
				message.react('🚭')
			}
			if (message.content.toLowerCase().includes("forgor")) {
				message.react("💀")
			}
			if (msgarr.includes('69')) {
				message.react(':IRT_Noice:611558357643558974')
			}
		}
}
}
