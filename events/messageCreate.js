const { ClientVoiceManager } = require('discord.js');

module.exports = {
    name: "messageCreate",
    execute: async (client, message) => {
    if (!client.config.botSwitches.commands && !client.config.eval.whitelist.includes(message.author.id)) return; // bot is being run in dev mode and a non eval whitelisted user sent a message. ignore the message.
	if (message.partial) return;
	if (message.author.bot) return;
	if (message.channel.type === "DM") {
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
            .setTimestamp(Date.now());
        let messageAttachmentsText = '';
        message.attachments.forEach(attachment => {
            if (!embed.image && ['png', 'jpg', 'webp', 'gif', 'jpeg'].some(x => attachment.name.endsWith(x))) embed.setImage(attachment.url);
            else messageAttachmentsText += `[${attachment.name}](${attachment.url})\n`;
        });
        if (messageAttachmentsText.length > 0) embed.addFields({name: 'Message Attachments', value: messageAttachmentsText.trim()});
        embed
            .addFields({name: 'Roles:', value: guildMemberObject.roles.cache.size > 1 ? guildMemberObject.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(guildMemberObject.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None'})
        channel.send({content: client.config.eval.whitelist.map(x => `<@${x}>`).join(', '), embeds: [embed]});
    }
	if (!message.guild) return;
	
	/* judge-your-build-event message filter; only allow messages that contain an image
	 if (message.channel.id === '925500847390097461' && message.attachments.size<1 && !message.author.bot) {
	  	message.delete();
	 } */

	/* handle banned words
	if (client.config.botSwitches.automod && client.bannedWords._content.some(word => message.content.toLowerCase().includes(word)) && !client.hasModPerms(client, message.member) && message.guild.id === client.config.mainServer.id)
		return message.delete() && message.channel.send("That word is banned here.").then(x => setTimeout(() => x.delete(), 5000));
	*/


	// useless staff ping mute
	const punishableRoleMentions = [
		client.config.mainServer.roles.helper,
		client.config.mainServer.roles.mod
	];
	if (message.mentions.roles.some(mentionedRole => punishableRoleMentions.includes(mentionedRole.id))) {
		console.log("user mentioned staff role");
		const filter = x => client.hasModPerms(client, x.member) && x.content === "y";
		message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"]}).then(async collected => {
			console.log("received \"y\" from staff member, indicating to mute someone");
			try {
				const muteResult = await client.punishments.addPunishment("mute", message.member, { time: "5m", reason: "Useless staff ping", message: message}, collected.first().author.id);
			} catch (error) {
				console.log("muting failed cuz", error);
			}
		}).catch(() => console.log("failed to collect \"y\" from staff"));
	}

	function onTimeout() {
		delete client.repeatedMessages[message.author.id];
	}

	// repeated messages; banned words
	const rparr = message.content.toLowerCase().split(' ');
	const Whitelist = [
		'688803177184886794', //farm-manager-chat
		'906960370919436338', //mp-action-log
		'830916009107652630', //public-admin-chat
		'690549465559597127', //mp-ban-list
		'677146047868436480', //mp-admin-chat
		'828982825734504448', //mp-server-managers-chat
	];

	if (client.bannedWords._content.some(x => rparr.includes(x)) && !client.hasModPerms(client, message.member) && !Whitelist.includes(message.channel.id) && client.config.botSwitches.automod) {
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
	if (message.content.includes("discord.gg/") && !client.hasModPerms(client, message.member) && !client.isMPStaff(client, message.member) && client.config.botSwitches.automod) {
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

	const WHITELISTED_CHANNELS = [
		'552565546093248512', //general
		'552609312560644112', //game-chat
		'553345291839864832', //community-ideas
		'743129368238489601', //consumables-chat
		'732369157617614938', //tech-talk
		'552587653304942594', //pictures
		'558777821846044676', //memes
		'708446663051837500', //trivia
		'891791005098053682', //fs22-silage
		'729823615096324166', //fs22-grain
		'982143077554720768', //mf-public-chat
		];
	// if message was sent in a whitelisted channel, count towards user level
	if (WHITELISTED_CHANNELS.includes(message.channel.id)) {client.userLevels.incrementUser(message.author.id)};
	
	// auto responses
	if (message.content.toLowerCase().includes('giants moment')) {
		message.react('™️');
	}
	if (message.content.toLowerCase().includes('nebs')) {
		message.react(':IRT_RooCry:780220030297571389')
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
	if (message.author.id === '769710040596217897' && message.channel.id === '552565546093248512' && message.content.toLowerCase().startsWith('night all')) {
		message.channel.send(`<@${message.author.id}>`)
	}
}
}
