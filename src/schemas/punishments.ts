import { EmbedBuilder, type User, type Snowflake } from "discord.js";
import mongoose from "mongoose";
import ms from "ms";
import type TClient from "../client.js";
import { BaseSchema } from "#structures";
import { formatString, formatTime, log } from "#util";

const model = mongoose.model("punishments", new mongoose.Schema({
    _id: { type: Number, required: true },
    type: { type: String, required: true },
    member: { required: true, type: {
        _id: { type: String, required: true },
        tag: { type: String, required: true },
    } },
    moderator: { type: String, required: true },
    expired: { type: Boolean },
    time: { type: Number, required: true },
    reason: { type: String, required: true },
    endTime: { type: Number },
    cancels: { type: Number },
    duration: { type: Number }
}, { versionKey: false }));

export class Punishments extends BaseSchema<typeof model> {
    public constructor(private readonly _client: TClient) {
        super(model);
    }

    public setExec(_id: number, timeout: number) {
        setTimeout(async () => {
            if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);
            
            const punishment = await this.data.findById(_id);

            if (!punishment || punishment.expired) return;

            log("Yellow", `${punishment.member.tag}'s ${punishment.type} (case #${punishment._id}) should expire now`);

            await this.removePunishment(punishment, this._client.user.id, "Time's up!")
                .catch(err => log("Red", "Error acting on punishment removal", err));
        }, timeout > 2_147_483_647 ? 2_147_483_647 : timeout);
    }

    private async makeModlogEntry(punishment: typeof this.obj) {
        const embed = new EmbedBuilder()
            .setTitle(`${formatString(punishment.type)} | Case #${punishment._id}`)
            .addFields(
                { name: "🔹 User", value: `${punishment.member.tag}\n<@${punishment.member._id}>\n\`${punishment.member._id}\``, inline: true },
                { name: "🔹 Moderator", value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
                { name: "🔹 Reason", value: `\`${punishment.reason}\``, inline: true })
            .setColor(this._client.config.EMBED_COLOR)
            .setTimestamp(punishment.time);

        if (punishment.duration) embed.addFields(
            { name: "🔹 Duration", value: formatTime(punishment.duration, 100), inline: true },
            { name: "\u200b", value: "\u200b", inline: true }
        );
        
        if (punishment.cancels) {
            const cancels = await this.data.findById(punishment.cancels);

            embed.addFields({ name: "🔹 Overwrites", value: `This case overwrites Case #${cancels?._id} \`${cancels?.reason}\`` });
        }
    
        await this._client.getChan("staffReports").send({ embeds: [embed] });
    }

    private async createId() {
        return Math.max(...(await this.data.find()).map(x => x._id), 0) + 1;
    }

    /** Get past tense form of punishment type */
    private getTense(type: string) {
        return {
            ban: "banned",
            softban: "softbanned",
            kick: "kicked",
            detain: "detained",
            mute: "muted",
            warn: "warned"
        }[type];
    }

    public async addPunishment(type: string, moderator: Snowflake, reason: string, user: User, duration?: string) {
        const now = Date.now();
        const guild = this._client.mainGuild();
        const newId = await this.createId();
        const caseData: typeof this.obj = { type, _id: newId, member: { tag: user.tag, _id: user.id }, reason, moderator, time: now };
        const inOrFrom = ["warn", "mute"].includes(type) ? "in" : "from";
        const auditLogReason = `${reason} | Case #${caseData._id}`;
        let dmSuccess = true;

        const sendDm = (dur?: number) => user
            .send(
                `You've been ${this.getTense(type)} ${inOrFrom} ${guild.name}` +
                (dur ? ` for ${formatTime(dur, 4, { longNames: true, commas: true })}` : "") +
                ` for reason \`${reason}\` (case #${caseData._id})`
            )
            .catch(() => {
                log("Yellow", `Failed to DM ${user.id}`);

                dmSuccess = false;

                return null;
            });

        switch (type) {
            case "ban": {
                const isBanned = await guild.bans.fetch(user).catch(() => null);
                
                if (isBanned) throw new Error("User is already banned!");
                
                const parsedTime = duration ? ms(duration) : undefined;
                const dm = await sendDm(parsedTime);
                
                await guild.bans.create(user, { reason: auditLogReason })
                    .catch(async err => {
                        await dm?.delete();

                        throw err;
                    });

                if (parsedTime) {
                    caseData.endTime = now + parsedTime;
                    caseData.duration = parsedTime;
                }
                    
                break;
            };
            case "softban": {
                const isBanned = await guild.bans.fetch(user).catch(() => null);

                if (isBanned) throw new Error("User is already banned!");

                const dm = await sendDm();

                await guild.bans.create(user, { reason: auditLogReason, deleteMessageSeconds: 86_400 })
                    .catch(async err => {
                        await dm?.delete();

                        throw err;
                    });

                await guild.bans.remove(user, auditLogReason);

                break;
            };
            case "kick": {
                const dm = await sendDm();

                await guild.members.kick(user, auditLogReason)
                    .catch(async err => {
                        await dm?.delete();

                        throw err;
                    });
                
                break;
            };
            case "detain": {
                await Promise.all([
                    guild.voiceStates.cache.get(user.id)?.disconnect(),
                    guild.members.addRole({ user, role: this._client.config.mainServer.roles.detained, reason: auditLogReason }),
                    sendDm()
                ]);

                break;
            };
            case "mute": {
                const member = await guild.members.fetch(user);

                if (member.isCommunicationDisabled()) throw new Error("User is already muted!");

                const parsedTime = duration ? ms(duration) : 2_073_600_000;
                
                if (parsedTime > 2_073_600_000) throw new Error("Cannot mute user for longer than 24 days!");

                await Promise.all([
                    member.timeout(parsedTime, auditLogReason),
                    sendDm(parsedTime)
                ]);

                caseData.endTime = now + parsedTime;
                caseData.duration = parsedTime;

                break;
            };
            case "warn": {
                await sendDm();

                break;
            }
        }
        
        const [caseDoc] = await Promise.all([
            this.data.create(caseData),
            this.makeModlogEntry(caseData)
        ]);

        if (caseData.endTime) this.setExec(caseData._id, caseData.endTime - now);

        return { caseDoc, dmSuccess };
    }

    public async removePunishment(punishment: typeof this.doc, moderator: Snowflake, reason: string) {
        const now = Date.now();
        const guild = this._client.mainGuild();
        const newId = await this.createId();
        const auditLogReason = `${reason} | Case $${newId}`;
        const caseData: typeof this.obj = {
            type: `un${punishment.type}`,
            _id: newId,
            cancels: punishment._id,
            member: punishment.member,
            time: now,
            reason,
            moderator
        };

        switch (punishment.type) {
            case "ban": {
                await guild.bans.remove(punishment.member._id);

                break;
            };
            case "softban": {
                throw new Error("Cannot undo softban!");
            };
            case "kick": {
                throw new Error("Cannot undo kick!");
            };
            case "detain": {
                await guild.members.removeRole({
                    user: punishment.member._id,
                    role: this._client.config.mainServer.roles.detained,
                    reason: auditLogReason
                });

                break;
            };
            case "mute": {
                await guild.members.edit(punishment.member._id, { communicationDisabledUntil: null, reason: auditLogReason });

                break;
            };
            case "warn": {
                // Only case data to be modified
                break;
            }
        }

        const [caseDoc] = await Promise.all([
            this.data.create(caseData),
            this.data.findByIdAndUpdate(punishment._id, { expired: true }),
            this.makeModlogEntry(caseData)
        ]);

        return caseDoc;
    }
}