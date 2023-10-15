import { Message, Collection } from 'discord.js';
import type TClient from '../client.js';
import { RepeatedMessagesData, RepeatedMessagesEntry, RepeatedMessagesIdentifiers } from '../typings.js';

export class RepeatedMessages {
    private data: RepeatedMessagesData = {};

    constructor(private client: TClient) { }

    public async increment(
        msg: Message<true>,
        options: {
            thresholdTime: number;
            thresholdAmt: number;
            identifier:RepeatedMessagesIdentifiers;
            muteTime: string;
            muteReason: string;
        }
    ) {
        const userData = this.data[msg.author.id];

        if (!userData) {
            this.data[msg.author.id] = {
                entries: new Collection<number, RepeatedMessagesEntry>().set(msg.createdTimestamp, {
                    identifier: options.identifier,
                    channel: msg.channel.id,
                    msg: msg.id
                }),
                timeout: setTimeout(() => delete this.data[msg.author.id], options.thresholdTime)
            };

            return;
        }

        // Add this message to the list
        userData.entries.set(msg.createdTimestamp, { identifier: options.identifier, channel: msg.channel.id, msg: msg.id });
    
        // Reset timeout
        clearTimeout(userData.timeout);
        userData.timeout = setTimeout(() => delete this.data[msg.author.id], options.thresholdTime);
    
        // Message mustve been sent after (now - threshold), so purge those that were sent earlier
        userData.entries = userData.entries.filter((x, i) => i >= Date.now() - options.thresholdTime);
    
        // A spammed message is one that has been sent within the threshold parameters
        const spammedMessage = userData.entries.find(x => {
            return userData.entries.filter(y => x.identifier === y.identifier).size >= options.thresholdAmt;
        });
    
        if (spammedMessage) {
            delete this.data[msg.author.id];
            await this.client.punishments.addPunishment('mute', this.client.user.id, `Automod; ${options.muteReason}`, msg.author, msg.member, { time: options.muteTime });

            const spamMsgIds = userData.entries.filter(x => x.identifier === "spam").map(x => x.msg);

            if (spamMsgIds) await msg.channel.bulkDelete(spamMsgIds);
        }
    }
}