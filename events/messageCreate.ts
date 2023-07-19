import Discord from 'discord.js';
import YClient from '../client.js';
import { isDCStaff, isMPStaff, log, Profanity } from '../utilities.js';
import { APIUser, LogColor } from '../typings.js';

export default async (client: YClient, message: Discord.Message<boolean>) => {
    if ((!client.config.botSwitches.commands && !client.config.devWhitelist.includes(message.author.id)) || message.system || message.author.bot) return;
    //   ^^^     Bot is set to ignore commands and non-dev sent a message, ignore the message.      ^^^

    const msg = message.content.replaceAll('\n', ' ').toLowerCase();
    const msgarr = msg.split(' ');
    const profanity = new Profanity(msg);

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

        return;
    }

    /** Message has been moderated against and deleted */
    let automodded = false;

    // useless staff ping mute
    if (message.mentions.roles.some(mentionedRole => mentionedRole.id === client.config.mainServer.roles.mpstaff)) {
        log(LogColor.Purple, `${message.author.tag} mentioned staff role`);
        
        message.channel.createMessageCollector({
            filter: x => isMPStaff(x.member as Discord.GuildMember) && x.content === 'y',
            max: 1,
            time: 60_000
        }).on('collect', async collected => {
            log(LogColor.Purple, `Received "y" from ${collected.author.tag}, indicating to mute`);

            await client.punishments.addPunishment('mute', collected.author.id, 'Automod; Misuse of staff ping', message.author, message.member, { time: '10m' });
            collected.react('✅');
        });
    }

    // RepeatedMessages
    if (client.config.botSwitches.automod && !isDCStaff(message.member as Discord.GuildMember) && !client.config.whitelistedCh.includes(message.channel.id)) {
        if (profanity.hasProfanity(client.bannedWords._content)) { // Banned words
            automodded = true;

            await message.reply('That word is banned here.').then(msg => {
                message.delete();
                setTimeout(() => msg.delete(), 5_000);
            });
            await client.repeatedMessages.increment(message, 30_000, 4, 'bw', { time: '30m', reason: 'Banned words' });
        } else if (msg.includes("discord.gg/") && !isMPStaff(message.member as Discord.GuildMember)) { // Discord advertisement
            const inviteURL = message.content.split(' ').find(x => x.includes('discord.gg/')) as string;
            const validInvite = await client.fetchInvite(inviteURL).catch(() => null);

            if (validInvite && validInvite.guild?.id !== client.config.mainServer.id) {
                automodded = true;

                await message.reply("No advertising other Discord servers.").then(msg => {
                    message.delete();
                    setTimeout(() => msg.delete(), 10_000);
                });
                await client.repeatedMessages.increment(message, 60_000, 2, 'adv', { time: '1h', reason: 'Discord advertisement' });
            }
        }
    }

    if (automodded) return;
    if (message.channel.id !== client.config.mainServer.channels.spamZone) client.userLevels.incrementUser(message.author.id);
    if (!client.config.botSwitches.autoResponses || !message.member) return;

    // Morning message systen
    const morningMsgs = ['morning all', 'morning everyone', 'morning guys', 'morning people'];

	if (morningMsgs.some(x => msg.includes(x)) && message.channel.id === client.config.mainServer.channels.general) {
        const randomEl = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const User = await client.rest.get(`/users/${message.author.id}`).catch(() => null) as APIUser | null;
        const person = (() => {
            if (message.member.displayName === message.author.username) {
                return User?.display_name ?? message.author.username;
            } else {
                const hasStaffTag = message.member.displayName.indexOf(' | ') < 0 ? false : true;
                return message.member.displayName.slice(0, hasStaffTag ? message.member.displayName.indexOf(' | ') : undefined).replace('[LOA] ', '');
            }
        })();
        const mornRes1 = [`Wakey wakey ${person}! `, `Morning ${person}! `, `Why good morning ${person}! `, `Rise and shine ${person}! `, `Up and at 'em ${person}! `];
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

        message.reply({
            content: randomEl(mornRes1) + randomEl(mornRes2),
            allowedMentions: { repliedUser: false }
        });
    }

    // Auto responses
    if (msg.includes('giants moment')) message.react('™️');
	
    if (msg.includes('sync sim')) message.react(':IRT_SyncSim22:929440249577365525');
	
    if (msg.includes('smoker')) message.react('🚭');
	
    if (msg.includes("forgor")) message.react("💀");
	
    if (msgarr.includes('69')) message.react(':IRT_Noice:611558357643558974');
}
