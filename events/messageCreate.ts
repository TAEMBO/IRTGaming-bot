import Discord from 'discord.js';
import YClient from '../client.js';
import { LogColor } from '../typings.js';

export default async (client: YClient, message: Discord.Message<boolean>) => {
    if ((!client.config.botSwitches.commands && !client.config.devWhitelist.includes(message.author.id)) || message.partial || message.author.bot) return;
    //   ^^^     Bot is set to ignore commands and non-dev sent a message, ignore the message.      ^^^

    const msg = message.content.replaceAll('\n', ' ').toLowerCase();
    const msgarr = msg.split(' ');

    if (!message.inGuild()) {
        const guildMemberObject = client.mainGuild().members.cache.get(message.author.id) as Discord.GuildMember;
        client.getChan('taesTestingZone').send({
            content: `DM Forward <@${client.config.devWhitelist[0]}>`,
            files: message.attachments.map(x => x.url),
            embeds: [new client.embed()
                .setTitle('Forwarded DM Message')
                .setDescription(`<@${message.author.id}>`)
                .setAuthor({ name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) })
                .setColor(client.config.embedColor)
                .setTimestamp()
                .setFields(
                    { name: 'Message Content', value: message.content.length > 1024 ? message.content.slice(0, 1000) + '...' : message.content + '\u200b' },
                    { name: 'Roles:', value: guildMemberObject.roles.cache.size > 1 ? guildMemberObject.roles.cache.filter(x => x.id !== client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(guildMemberObject.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None' })
            ]
        });
    } else {
		let automodded = false;
	
		// useless staff ping mute
		if (message.mentions.roles.some(mentionedRole => mentionedRole.id === client.config.mainServer.roles.mpstaff)) {
			client.log(LogColor.Purple, `${message.author.tag} mentioned staff role`);
			message.channel.awaitMessages({
				filter: x => client.isMPStaff(x.member as Discord.GuildMember) && x.content === 'y',
				max: 1,
				time: 60000
			}).then(async collected => {
				const colMsg = collected.first() as Discord.Message<true>;
				client.log(LogColor.Purple, `Received "y" from ${colMsg.author.tag}, indicating to mute`);
				await client.punishments.addPunishment('mute', colMsg.author.id, 'Automod; Misuse of staff ping', message.author, message.member, { time: '10m' });
				colMsg.react('✅');
			});
		}
	
		const Whitelist = [
			'688803177184886794', // farm-manager-chat
			'906960370919436338', // mp-action-log
			'830916009107652630', // junior-admin-chat
			'733828561215029268', // mp-staff-commands
			'690549465559597127', // mp-ban-list
			'677146047868436480', // senior-admin-chat
			'828982825734504448', // mf-manager-chat
			'986969325112033330', // mf-serverlog
			'968265015595532348', // mp-manager-chat
			'979863373439184966', // war crimes
		];
		async function repeatedMessages(thresholdTime: number, thresholdAmt: number, type: string, muteTime?: string, muteReason?: string) {
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
					await client.punishments.addPunishment('mute', (client.user?.id as string), `Automod; ${muteReason}`, message.author, message.member, { time: muteTime });
				}
			} else {
				client.repeatedMessages[message.author.id] = { data: new client.collection(), timeout: setTimeout(() => delete client.repeatedMessages[message.author.id], thresholdTime) };
				client.repeatedMessages[message.author.id].data.set(message.createdTimestamp, { type, channel: message.channel.id });
			}
		}
		let loop = 0;
		function allPossibleCases(arr: string[][]): string[] {
			loop++;
			if (arr.length === 1 || loop > 20) return arr[0];
			const result = [];
			const allCasesOfRest = allPossibleCases(arr.slice(1));
			for (let i = 0; i < allCasesOfRest.length; i++) {
				for (let j = 0; j < arr[0].length; j++) result.push(arr[0][j] + allCasesOfRest[i]);
			}
			return result;
		}
		const getAllCombos = (message: string) => message.split(" ").map(word => {
			if (/(.)\1{1,}/.test(word) && word.length > 3) {
                const val = [];
                const arr = [];
                let chop = word[0];
                for (let i = 1; i <= word.length; i++) {
                    if (chop[0] != word[i]) {
                        val.push(chop);
                        chop = word[i];
                    } else chop += word[i];
    
                }
                for (let i = 0; i < val.length; i++) {
                    let temp = [];
                    if (val[i].length >= 2) temp.push(val[i][0].repeat(2));
                    temp.push(val[i][0]);
                    arr.push(temp);
                }
				return allPossibleCases(arr).join(' ');
			} else return word;
		});
		let newMsg = msg;
		new Map([[/!/g, "i"], [/@/g, "a"], [/\$/g, "s"], [/3/g, "e"], [/1/g, "i"], [/¡/g, "i"],[/5/g, "s"], [/0/g, "o"], [/4/g, "h"], [/7/g, "t"], [/9/g, "g"], [/6/g, "b"], [/8/g, "b"]]).forEach((str, reg) => newMsg = newMsg.replace(reg, str));
		const combedMsg = getAllCombos(newMsg.replace(/[^a-zA-Z\s]/g, "")).join(' ').replace(/ +(?= )/g, "").split(' ');

		// RepeatedMessages
		if (client.config.botSwitches.automod && !client.isDCStaff(message.member as Discord.GuildMember)) {
			if (client.bannedWords._content.some(x => combedMsg.includes(x)) && !Whitelist.includes(message.channel.id)) { // Banned words
				automodded = true;
				await message.reply('That word is banned here.').then(msg => {
					message.delete();
					setTimeout(() => msg.delete(), 5000);
				});
				await repeatedMessages(30000, 4, 'bw', '30m', 'Banned words');
			} else if (msg.includes("discord.gg/") && !client.isMPStaff(message.member as Discord.GuildMember)) { // Discord advertisement
				const inviteURL = message.content.split(' ').find(x => x.includes('discord.gg/')) as string;
				const validInvite = await client.fetchInvite(inviteURL).catch(() => null);
				if (validInvite && validInvite.guild?.id !== client.config.mainServer.id) {
					automodded = true;
					await message.reply("No advertising other Discord servers.").then(msg => {
						message.delete();
						setTimeout(() => msg.delete(), 10000);
					});
					await repeatedMessages(60000, 2, 'adv', '1h', 'Discord advertisement');
				}
			}
		}

        if (automodded) return;
        if (message.channel.id !== '557692151689904129') client.userLevels.incrementUser(message.author.id);
        if (!client.config.botSwitches.autoResponses || !message.member) return;
			
        // Morning message system
        const hasStaffTag = message.member.displayName.indexOf(' | ') < 0 ? false : true;
        const person = message.member.displayName.slice(0, hasStaffTag ? message.member.displayName.indexOf(' | ') : undefined);
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
	
		// Auto responses
        const randomEl = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        
		if (morningMsgs.some(x => msg.includes(x)) && message.channel.id === client.config.mainServer.channels.general) message.reply({
            content: randomEl(mornRes1) + randomEl(mornRes2),
            allowedMentions: { repliedUser: false }
        });
		
		if (msg.includes('giants moment')) message.react('™️');
		
		if (msg.includes('sync sim')) message.react(':IRT_SyncSim22:929440249577365525');
		
		if (msg.includes('smoker')) message.react('🚭');
		
		if (msg.includes("forgor")) message.react("💀");
		
		if (msgarr.includes('69')) message.react(':IRT_Noice:611558357643558974');
		
		if (msg.startsWith('!rank')) message.reply({ content: 'Ranking has been moved to </rank view:1042659197919178790>', allowedMentions: { repliedUser: false } });
	}
}
