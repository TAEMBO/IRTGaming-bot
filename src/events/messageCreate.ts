import { EmbedBuilder, Message } from 'discord.js';
import { isDCStaff, isMPStaff, log, Profanity } from '../utilities.js';

export default async (message: Message<boolean>) => {
    if ((!message.client.config.toggles.commands && !message.client.config.devWhitelist.includes(message.author.id)) || message.system || message.author.bot) return;
    //   ^^^     Bot is set to ignore commands and non-dev sent a message, ignore the message.      ^^^

    const msg = message.content.replaceAll('\n', ' ').toLowerCase();
    const profanity = new Profanity(msg);

    if (!message.inGuild()) {
        const member = message.client.mainGuild().members.cache.get(message.author.id);

        if (!member) return;

        return await message.client.getChan('taesTestingZone').send({
            content: `DM Forward <@${message.client.config.devWhitelist[0]}>`,
            files: message.attachments.map(x => x.url),
            embeds: [new EmbedBuilder()
                .setTitle('Forwarded DM Message')
                .setDescription(`<@${message.author.id}>`)
                .setAuthor({ name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) })
                .setColor(message.client.config.EMBED_COLOR)
                .setTimestamp()
                .setFields(
                    { name: 'Message Content', value: message.content.length > 1024 ? message.content.slice(0, 1000) + '...' : message.content + '\u200b' },
                    { name: 'Roles:', value: member.roles.cache.size > 1 ? member.roles.cache.filter(x => x.id !== message.client.config.mainServer.id).sort((a, b) => b.position - a.position).map(x => x).join(member.roles.cache.size > 4 ? ' ' : '\n').slice(0, 1024) : 'None' })
            ]
        });
    }

    /** Message has been moderated against and deleted */
    let automodded = false;

    // Misuse of staff ping
    if (message.mentions.roles.some(role => role.id === message.client.config.mainServer.roles.mpstaff)) {
        log('Purple', `${message.author.tag} mentioned staff role`);
        
        message.channel.createMessageCollector({
            filter: x => isMPStaff(x.member) && x.content === 'y',
            max: 1,
            time: 60_000
        }).on('collect', async collected => {
            log('Purple', `Received "y" from ${collected.author.tag}, indicating to mute`);

            await message.client.punishments.addPunishment('mute', collected.author.id, 'Automod; Misuse of staff ping', message.author, message.member, { time: '10m' });
            await collected.react('✅');
        });
    }

    // RepeatedMessages
    const isWhitelisted = message.client.config.whitelist.bannedWords.some(x => [message.channelId, message.channel.parentId].includes(x));

    if (message.client.config.toggles.automod && !isDCStaff(message.member) && !isWhitelisted) {
        if (profanity.hasProfanity(message.client.bannedWords.data)) {
            automodded = true;

            const msg = await message.reply("That word is banned here.");

            await message.delete();
            setTimeout(async () => await msg.delete(), 10_000);

            await message.client.repeatedMessages.increment(message, {
                thresholdTime: 30_000,
                thresholdAmt: 4,
                identifier: "bw",
                muteTime: "30m",
                muteReason: "Banned words"
            });
        } else if (msg.includes("discord.gg/") && !isMPStaff(message.member)) {
            const inviteURL = message.content.split(' ').find(x => x.includes('discord.gg/')) as string;
            const validInvite = await message.client.fetchInvite(inviteURL).catch(() => null);

            if (validInvite && validInvite.guild?.id !== message.client.config.mainServer.id) {
                automodded = true;

                const msg = await message.reply("No advertising other Discord servers.");

                await message.delete();
                setTimeout(async () => await msg.delete(), 10_000);

                await message.client.repeatedMessages.increment(message, {
                    thresholdTime: 60_000,
                    thresholdAmt: 2,
                    identifier: "adv",
                    muteTime: "1h",
                    muteReason: "Discord advertisement"
                });
            }
        } else if (message.channelId !== message.client.config.mainServer.channels.spamZone && !isMPStaff(message.member)) {
            await message.client.repeatedMessages.increment(message, {
                thresholdTime: 5_000,
                thresholdAmt: 5,
                identifier: "spam",
                muteTime: "1h",
                muteReason: "Repeated messages"
            });
        }
    }

    if (automodded) return;
    if (message.channelId !== message.client.config.mainServer.channels.spamZone) await message.client.userLevels.incrementUser(message.author.id);
    if (!message.client.config.toggles.autoResponses) return;

    // MF mod voting
    if (message.channelId === message.client.config.mainServer.channels.mfModSuggestions && message.content.startsWith("http")) {
        await message.react(":IRT_Upvote:764965325342244915");
        await message.react(":IRT_Downvote:764965659423408148");
    }

    // Morning message system
	if (
        ['morning all', 'morning everyone', 'morning guys', 'morning people'].some(x => msg.includes(x))
        && message.channelId === message.client.config.mainServer.channels.general
    ) {
        const randomEl = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const staffTag = message.member?.displayName.indexOf(' | ') ?? NaN < 0 ? undefined : message.member?.displayName.indexOf(' | ');
        const person = message.member?.displayName.slice(0, staffTag).replace('[LOA] ', '');
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

        await message.reply({
            content: randomEl(mornRes1) + randomEl(mornRes2),
            allowedMentions: { repliedUser: false }
        });
    }
}
