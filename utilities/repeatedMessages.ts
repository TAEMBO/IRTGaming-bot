import Discord from 'discord.js';
import YClient from '../client.js';
import { RepeatedMessagesData } from '../typings.js';

export class RepeatedMessages {
    private data: RepeatedMessagesData = {};

    constructor(private client: YClient) { }

    public async increment(msg: Discord.Message<boolean>, thresholdTime: number, thresholdAmt: number, type: string, muteOpt?: { time?: string, reason?: string }) {
        if (this.data[msg.author.id]) {
            // Add this message to the list
            this.data[msg.author.id].data.set(msg.createdTimestamp, { type, channel: msg.channel.id });
    
            // Reset timeout
            clearTimeout(this.data[msg.author.id].timeout);
            this.data[msg.author.id].timeout = setTimeout(() => delete this.data[msg.author.id], thresholdTime);
    
            // Message mustve been sent after (now - threshold), so purge those that were sent earlier
            this.data[msg.author.id].data = this.data[msg.author.id].data.filter((x, i) => i >= Date.now() - thresholdTime);
    
            // A spammed message is one that has been sent within the threshold parameters
            const spammedMessage = this.data[msg.author.id].data.find(x => {
                return this.data[msg.author.id].data.filter(y => x.type === y.type).size >= thresholdAmt;
            });
    
            if (spammedMessage) {
                delete this.data[msg.author.id];
                await this.client.punishments.addPunishment('mute', (this.client.user?.id as string), `Automod; ${muteOpt?.reason}`, msg.author, msg.member, { time: muteOpt?.time });
            }
        } else {
            this.data[msg.author.id] = { data: new Discord.Collection(), timeout: setTimeout(() => delete this.data[msg.author.id], thresholdTime) };
            this.data[msg.author.id].data.set(msg.createdTimestamp, { type, channel: msg.channel.id });
        }
    }
}