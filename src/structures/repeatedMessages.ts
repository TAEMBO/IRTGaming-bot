import { Collection, type Message } from "discord.js";
import type TClient from "../client.js";
import { log } from "#util";
import type { RepeatedMessagesData, RepeatedMessagesEntry, RepeatedMessagesIdentifiers } from "#typings";

export class RepeatedMessages {
    private _data: RepeatedMessagesData = {};

    public constructor(private readonly _client: TClient) { }

    public async increment(
        msg: Message<true>,
        options: {
            thresholdTime: number;
            thresholdAmt: number;
            identifier: RepeatedMessagesIdentifiers;
            muteTime: string;
            muteReason: string;
        }
    ) {
        const userData = this._data[msg.author.id];

        if (!userData) {
            this._data[msg.author.id] = {
                entries: new Collection<number, RepeatedMessagesEntry>().set(msg.createdTimestamp, {
                    identifier: options.identifier,
                    channel: msg.channelId,
                    msg: msg.id
                }),
                timeout: setTimeout(() => delete this._data[msg.author.id], options.thresholdTime)
            };

            return;
        }

        // Add this message to the list
        userData.entries.set(msg.createdTimestamp, { identifier: options.identifier, channel: msg.channelId, msg: msg.id });

        // Reset timeout
        clearTimeout(userData.timeout);
        userData.timeout = setTimeout(() => delete this._data[msg.author.id], options.thresholdTime);

        // Message mustve been sent after (now - threshold), so purge those that were sent earlier
        userData.entries = userData.entries.filter((_, i) => i >= Date.now() - options.thresholdTime);

        // A spammed message is one that has been sent within the threshold parameters
        const spammedMessage = userData.entries.find(x => {
            return userData.entries.filter(y => x.identifier === y.identifier).size >= options.thresholdAmt;
        });

        if (!spammedMessage) return;

        delete this._data[msg.author.id];

        await this._client.punishments.addPunishment("mute", this._client.user.id, `Automod; ${options.muteReason}`, msg.author, options.muteTime)
            .catch(err => log("Red", "Failed to add punishment:", err));

        const spamMsgIds = userData.entries.filter(x => x.identifier === "spam").map(x => x.msg);

        if (spamMsgIds.length) await msg.channel.bulkDelete(spamMsgIds);
    }
}