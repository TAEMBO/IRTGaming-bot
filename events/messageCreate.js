module.exports = {
    name: "messageCreate",
    tracker: false,
    giveaway: false,
	frs: false,
    execute: async (client, message) => {
    if (!client.config.botSwitches.commands && !client.config.eval.whitelist.includes(message.author.id)) return; // bot is being run in dev mode and a non eval whitelisted user sent a message. ignore the message.
	if (message.partial) return;
	if (message.author.bot) return;
	if (message.channel.type === "DM") {
        if (client.dmForwardBlacklist._content.includes(message.author.id) || message.author.bot) return;
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

	// handle banned words
	if (client.config.botSwitches.automod && client.bannedWords._content.some(word => message.content.toLowerCase().includes(word)) && !client.hasModPerms(client, message.member) && message.guild.id === client.config.mainServer.id)
		return message.delete() && message.channel.send("That word is banned here.").then(x => setTimeout(() => x.delete(), 5000));


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
			if (client.repeatedMessages[message.author.id]?.nicknameChanged) message.member.setNickname(null, "repeated messages; false alarm");
			delete client.repeatedMessages[message.author.id];
		}

		// repeated messages
		if (message.content.length > 10 && ["https://", "http://", "@everyone", "@here", ".com", ".ru", ".org", ".net", ".xyz"].some(x => message.content.toLowerCase().includes(x)) && message.guild.id === client.config.mainServer.id && !client.hasModPerms(client, message.member)) {
		if (!client.config.botSwitches.automod) return;
			const thisContent = message.content.slice(0, 32);
			if (client.repeatedMessages[message.author.id]) {
				if (thisContent.includes('tenor')) {
					return;
				} else if(thisContent.includes("discord")){ return; } else {
				// add this message to the list
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: thisContent, ch: message.channel.id });

				// reset timeout
				clearTimeout(client.repeatedMessages[message.author.id].to);
				client.repeatedMessages[message.author.id].to = setTimeout(onTimeout, 60000);

				// this is the time in which 3 messages have to be sent, in milliseconds
				const threshold = 60000;

				// message mustve been sent after (now - threshold), so purge those that were sent earlier
				client.repeatedMessages[message.author.id] = client.repeatedMessages[message.author.id].filter((x, i) => i >= Date.now() - threshold)

				// if user has sent the same message 2 times in the last threshold milliseconds, change their nickname
				if (client.repeatedMessages[message.author.id]?.find(x => {
					return client.repeatedMessages[message.author.id].filter(y => y.cont === x.cont).size === 2;
				})) {
					client.repeatedMessages[message.author.id].nicknameChanged = true;
					message.member.setNickname("⚠ Possible Scammer ⚠", "repeated messages");
				}

				/* if user has sent the same message 3 times in the last threshold milliseconds, notify them
				if (client.repeatedMessages[message.author.id]?.find(x => {
					return client.repeatedMessages[message.author.id].filter(y => y.cont === x.cont).size === 3;
				})) {
					client.repeatedMessages[message.author.id].warnMsg = await message.reply("Stop spamming that message!");
				}*/

				// a spammed message is one that has been sent at least 3 times in the last threshold milliseconds
				const spammedMessage = client.repeatedMessages[message.author.id]?.find(x => {
					return client.repeatedMessages[message.author.id].filter(y => y.cont === x.cont).size >= 3;
				});

				// if a spammed message exists;
				if (spammedMessage) {
					// softban
					const softbanResult = await client.punishments.addPunishment("softban", message.member, { reason: "repeated messages" }, client.user.id);

					// timestamp of first spammed message
					const spamOriginTimestamp = client.repeatedMessages[message.author.id].firstKey();

					client.repeatedMessagesContent.addData(message.content.split(' ')).forceSave();
					const index = client.repeatedMessagesContent._content.length - 1;

					// send info about this user and their spamming
					client.channels.cache.get(client.config.mainServer.channels.staffreports).send({content: `Anti-spam triggered, here's the details:\n\`https://\` ${message.content.toLowerCase().includes("https://") ? ":white_check_mark:" : ":x:"}\n\`http://\` ${message.content.toLowerCase().includes("http://") ? ":white_check_mark:" : ":x:"}\n\`@everyone/@here\` ${(message.content.toLowerCase().includes("@everyone") || message.content.toLowerCase().includes("@here")) ? ":white_check_mark:" : ":x:"}\n\`top-level domain\` ${[".com", ".ru", ".org", ".net"].some(x => message.content.toLowerCase().includes(x))}\nMessage Information:\n${client.repeatedMessages[message.author.id].map((x, i) => `: ${i - spamOriginTimestamp}ms, <#${x.ch}>`).map((x, i) => `\`${i + 1}\`` + x).join("\n")}\nThreshold: ${threshold}ms\nLRS message Count: ${client.userLevels.getUser(message.author.id)}`});

					// and clear their list of long messages
					delete client.repeatedMessages[message.author.id];
				}
			}} else {
				client.repeatedMessages[message.author.id] = new client.collection();
				client.repeatedMessages[message.author.id].set(message.createdTimestamp, { cont: message.content.slice(0, 32), ch: message.channel.id });

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
			'855577815491280958', //counting
			'708446663051837500', //trivia
			'891791005098053682', //fs22-silage
			'729823615096324166', //fs22-grain
			'982143077554720768', //mf-public-chat
		];
		// if message was not sent in a whitelisted channel and this is the right server, count towards user level
		if (WHITELISTED_CHANNELS.includes(message.channel.id) && message.guild.id === client.config.mainServer.id){ 
			client.userLevels.incrementUser(message.author.id);
			const eligiblity = await client.userLevels.getEligible(message.member);			
			let nextRoleKey;
			//const roleArray = [];
			//client.config.mainServer.roles.levels.forEach((e)=>{roleArray.push(e.id)});
			Object.values(client.config.mainServer.roles.levels).map(x=>x.id).forEach(async (role)=>{
				if(message.member.roles.cache.has(role)){
					nextRoleKey = parseInt(`${message.guild.roles.cache.get(role).name}`.toLowerCase().replace("level ", ""));
				}
			});
			if(nextRoleKey){
			// eligibility information about the next level role
			const nextRoleReq = eligiblity.roles[nextRoleKey ? nextRoleKey : 0];
			const lastRoleReq = nextRoleKey ? eligiblity.roles[nextRoleKey - 1] : null;
	
			// next <Role> in level roles that user is going to get 
			const nextRole = nextRoleReq ? nextRoleReq.role.id : undefined;
			const lastRole = lastRoleReq ? lastRoleReq.role.id : undefined;
			if(nextRoleReq.eligible){
			message.member.roles.add(nextRole);
			message.member.roles.remove(lastRole);
			// client.channels.cache.get(client.config.mainServer.channels.botcommands).send({content: `<@${message.author.id}> has received the <@&${nextRole}> role.`, allowedMentions: {roles: false}});
			}
			}
		}
	// handle discord invite links
	if (message.content.includes("discord.gg/") && !client.hasModPerms(client, message.member) && !client.isMPStaff(client, message.member) && message.guild.id === client.config.mainServer.id) {
		if (!client.config.botSwitches.automod) return;
		message.delete()
		client.punishments.addPunishment("warn", message.member, { reason: "Discord advertisement" }, client.user.id)
		message.channel.send("No advertising other Discord servers.").then(x => setTimeout(() => x.delete(), 10000))
	}
	if (message.content.startsWith("!restart") && client.config.eval.whitelist.includes(message.author.id)) {
		console.log('restart')
		message.reply('Restarting...').then(async ()=> eval(process.exit(-1)))
	}
	if (message.content.startsWith('!eval') && client.isMPStaff(client, message.member)) {
		const util = require('util');
		const args = message.content.replace(/\n/g, " ").split(" ");
		const removeUsername = (text) => {
		let matchesLeft = true;
		const array = text.split('\\');
		while (matchesLeft) {
			let usersIndex = array.indexOf('Users');
			if (usersIndex < 1) matchesLeft = false;
			else {
				let usernameIndex = usersIndex + 1;
				if (array[usernameIndex].length === 0) usernameIndex += 1;
				array[usernameIndex] = '#'.repeat(array[usernameIndex].length);
				array[usersIndex] = 'Us\u200bers';
			}
		}
		return array.join('\\');
		};
			if (!client.config.eval.allowed) return message.channel.send('Eval is disabled.');
			if (!client.config.eval.whitelist.includes(message.author.id)) return message.channel.send('You\'re not allowed to use eval');
			const code = message.content.slice(args[0].length + 1);
			let output = 'error';
			let error = false;
			try {
				output = await eval(code);
			} catch (err) {
				error = true;
				const embed = new client.embed()
					.setTitle('__Eval__')
					.addField('Input', `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``)
					.addField('Output', `\`\`\`\n${err}\n\`\`\``)
					.setColor('ff0000');
				message.channel.send({embeds: [embed]}).then(errorEmbedMessage => {
					const filter = x => x.content === 'stack' && x.author.id === message.author.id
					const messagecollector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });
					messagecollector.on('collect', collected => {
						collected.channel.send(`\`\`\`\n${removeUsername(err.stack)}\n\`\`\``);
					});
				});
			}
			if (error) return;
			if (typeof output === 'object') {
				output = 'js\n' + util.formatWithOptions({ depth: 1 }, '%O', output);
			} else {
				output = '\n' + String(output);
			}
			const regexp = new RegExp(client.token, 'g');
			output = output.replace(regexp, 'TOKEN_LEAK');
			const embed = new client.embed()
				.setTitle('__Eval__')
				.addField('Input', `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\``)
				.addField('Output', `\`\`\`${removeUsername(output).slice(0, 1016)}\n\`\`\``)
				.setColor(3971825);
			message.channel.send({embeds: [embed]});
		}
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
}
}
