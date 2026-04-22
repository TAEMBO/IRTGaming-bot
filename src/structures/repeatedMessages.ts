import { createHash } from "node:crypto";
import type { Message, MessageCollector, Snowflake } from "discord.js";
import type TClient from "../client.js";
import { addPunishment } from "#db";
import { hasProfanity, isMPStaff, log, tempReply } from "#util";

const inviteRegEx = new RegExp(/(https?:\/\/)?(www\.)?((discordapp\.com\/invite)|(discord\.gg))\/(?<code>\w+)/m);

enum RepeatedMessagesType {
    Advertisement,
    BannedWords,
    ContentSpam,
    AttachmentSpam,
}

interface IncrementOptions {
    thresholdTime: number;
    thresholdAmt: number;
    type: RepeatedMessagesType;
    muteTime: string;
    muteReason: string;
}

interface RMMessageEntry {
    contentHash: string;
    type: RepeatedMessagesType;
    channelId: Snowflake;
    messageId: Snowflake;
    timestamp: number;
}

interface RMUserData {
    msgEntries: RMMessageEntry[];
    timeout: NodeJS.Timeout;
}

export class RepeatedMessages {
    private readonly userEntries = new Map<string, RMUserData>();
    private staffPingCollector?: MessageCollector;

    public constructor(private readonly client: TClient) {}

    private async increment(message: Message<true>, options: IncrementOptions) {
        const userEntry = this.userEntries.get(message.author.id);
        const contentHash = createHash("md5").update(message.content.trim()).digest("hex");
        const newEntry: RMMessageEntry = {
            contentHash,
            type: options.type,
            channelId: message.channelId,
            messageId: message.id,
            timestamp: message.createdTimestamp,
        };

        // Create user data if none already exists
        if (!userEntry) {
            this.userEntries.set(message.author.id, {
                msgEntries: [newEntry],
                timeout: setTimeout(() => this.userEntries.delete(message.author.id), options.thresholdTime),
            });

            return;
        }

        // Add this message to the list
        userEntry.msgEntries.push(newEntry);

        // Reset timeout
        clearTimeout(userEntry.timeout);
        userEntry.timeout = setTimeout(() => this.userEntries.delete(message.author.id), options.thresholdTime);

        // Message must've been sent after (now - threshold), so purge those that were sent earlier
        userEntry.msgEntries = userEntry.msgEntries.filter(entry => entry.timestamp >= Date.now() - options.thresholdTime);

        const filteredMsgEntries = options.type === RepeatedMessagesType.ContentSpam
            ? userEntry.msgEntries.filter(entry => entry.contentHash === contentHash)
            : userEntry.msgEntries.filter(entry => entry.type === options.type);

        // Check if threshold was met for this increment type
        const thresholdMet = filteredMsgEntries.length >= options.thresholdAmt;

        if (!thresholdMet) return;

        this.userEntries.delete(message.author.id);

        await addPunishment(this.client, "mute", this.client.user.id, `Automod; ${options.muteReason}`, message.author.id, options.muteTime)
            .catch(err => log("red", `Failed to add punishment: ${err}`));

        const uniqueChannelIds = new Set([...userEntry.msgEntries.map(x => x.channelId)]);

        for (const channelId of uniqueChannelIds) {
            const channel = this.client.mainGuild().channels.resolve(channelId);

            if (channel?.isTextBased()) await channel.bulkDelete(userEntry.msgEntries.map(x => x.messageId));
        }
    }

    public async triageMessage(message: Message<true>) {
        let automodded = false;

        // Misuse of staff ping
        if (message.mentions.roles.has(this.client.config.mainServer.roles.mpStaff)) {
            log("magenta", `${message.author.tag} mentioned staff role`);

            if (this.staffPingCollector && !this.staffPingCollector.ended) this.staffPingCollector.stop();

            this.staffPingCollector = message.channel.createMessageCollector({
                filter: x => isMPStaff(x.member) && x.content === "y",
                max: 1,
                time: 60_000
            }).on("collect", async collected => {
                log("magenta", `Received "y" from ${collected.author.tag}, indicating to mute`);

                try {
                    await addPunishment(this.client, "mute", collected.author.id, "Automod; Misuse of staff ping", message.author.id, "12h");
                    await collected.react("✅");
                } catch (err) {
                    log("red", `Failed to add punishment: ${err}`);

                    await collected.react("❗");
                }
            });
        }

        const regexResult = inviteRegEx.exec(message.content);

        if (hasProfanity(message.content.toLowerCase())) {
            automodded = true;

            await tempReply(message, { timeout: 10_000, content: "Watch your language" });
            await message.delete();

            await this.increment(message, {
                thresholdTime: 60_000,
                thresholdAmt: 4,
                type: RepeatedMessagesType.BannedWords,
                muteTime: "12h",
                muteReason: "Banned words",
            });
        } else if (regexResult && !isMPStaff(message.member)) {
            const validInvite = regexResult?.groups?.code
                ? await this.client.fetchInvite(regexResult.groups.code).catch(() => null)
                : null;

            if (validInvite && validInvite.guild?.id !== this.client.config.mainServer.id) {
                automodded = true;

                await tempReply(message, { timeout: 10_000, content: "No advertising other Discord servers" });
                await message.delete();

                await this.increment(message, {
                    thresholdTime: 120_000,
                    thresholdAmt: 2,
                    type: RepeatedMessagesType.Advertisement,
                    muteTime: "6h",
                    muteReason: "Discord advertisement",
                });
            }
        } else if (message.channelId !== this.client.config.mainServer.channels.spamZone && !isMPStaff(message.member)) {
            const filteredAttachments = message.attachments.filter(x => x.contentType?.startsWith("image/"));

            if (filteredAttachments.size >= 4) {
                await this.increment(message, {
                    thresholdTime: 30_000,
                    thresholdAmt: 4,
                    type: RepeatedMessagesType.AttachmentSpam,
                    muteTime: "24h",
                    muteReason: "Attachment spam",
                });
            } else {
                await this.increment(message, {
                    thresholdTime: 30_000,
                    thresholdAmt: 4,
                    type: RepeatedMessagesType.ContentSpam,
                    muteTime: "24h",
                    muteReason: "Spam",
                });
            }
        }

        return automodded;
    }
}
