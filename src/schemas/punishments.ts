import { type ChatInputCommandInteraction, EmbedBuilder, type GuildMember, type User } from "discord.js";
import type TClient from "../client.js";
import mongoose from "mongoose";
import ms from "ms";
import { formatString, formatTime, log } from "#util";

const model = mongoose.model(
    "punishments",
    new mongoose.Schema(
        {
            _id: { type: Number, required: true },
            type: { type: String, required: true },
            member: {
                required: true,
                type: {
                    _id: { type: String, required: true },
                    tag: { type: String, required: true },
                },
            },
            moderator: { type: String, required: true },
            expired: { type: Boolean },
            time: { type: Number, required: true },
            reason: { type: String, required: true },
            endTime: { type: Number },
            cancels: { type: Number },
            duration: { type: Number },
        },
        { versionKey: false },
    ),
);

export type PunishmentsDocument = ReturnType<typeof model.castObject>;

export class Punishments {
    public data = model;

    public constructor(private readonly _client: TClient) {}

    public setExec(_id: number, timeout: number) {
        setTimeout(
            async () => {
                if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);

                const punishment = await this.data.findById(_id);

                if (!punishment) return;

                log("Yellow", `${punishment.member.tag}'s ${punishment.type} (case #${punishment._id}) should expire now`);
                await this.removePunishment(punishment._id, this._client.user.id, "Time's up!").then(result => log("Yellow", result));
            },
            timeout > 2_147_483_647 ? 2_147_483_647 : timeout,
        );
    }

    private async makeModlogEntry(punishment: PunishmentsDocument) {
        const embed = new EmbedBuilder()
            .setTitle(`${formatString(punishment.type)} | Case #${punishment._id}`)
            .addFields(
                {
                    name: "🔹 User",
                    value: `${punishment.member.tag}\n<@${punishment.member._id}>\n\`${punishment.member._id}\``,
                    inline: true,
                },
                { name: "🔹 Moderator", value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
                { name: "🔹 Reason", value: `\`${punishment.reason}\``, inline: true },
            )
            .setColor(this._client.config.EMBED_COLOR)
            .setTimestamp(punishment.time);

        if (punishment.duration)
            embed.addFields(
                { name: "🔹 Duration", value: formatTime(punishment.duration, 100), inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
            );

        if (punishment.cancels) {
            const cancels = await this.data.findById(punishment.cancels);

            embed.addFields({
                name: "🔹 Overwrites",
                value: `This case overwrites Case #${cancels?._id} \`${cancels?.reason}\``,
            });
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
            warn: "warned",
        }[type];
    }

    public async addPunishment(
        type: string,
        moderator: string,
        reason: string,
        user: User,
        guildMember: GuildMember | null,
        options: {
            time?: string;
            interaction?: ChatInputCommandInteraction<"cached">;
        },
    ) {
        const { time, interaction } = options;
        const { _client } = this;
        const now = Date.now();
        const guild = _client.mainGuild();
        const punData: PunishmentsDocument = {
            type,
            _id: await this.createId(),
            member: { tag: user.tag, _id: user.id },
            reason,
            moderator,
            time: now,
        };
        // Use "in" if the punishment doesn't remove the member from the server, eg. mute, warn
        const inOrFromBoolean = ["warn", "mute"].includes(type) ? "in" : "from";
        const auditLogReason = `${reason} | Case #${punData._id}`;
        const embed = new EmbedBuilder()
            .setColor(_client.config.EMBED_COLOR)
            .setTitle(`Case #${punData._id}: ${formatString(type)}`)
            .setDescription(`${user.tag}\n${user}\n(\`${user.id}\`)`)
            .addFields({ name: "Reason", value: reason });
        let timeInMillis: number | null;
        let punResult;

        if (type === "mute") {
            const parsedTime = time ? ms(time) : 2_073_600_000;

            if (parsedTime > 2_073_600_000) return await interaction?.editReply("You cannot mute someone for longer than 24 days.");

            timeInMillis = parsedTime;
        } else timeInMillis = time ? ms(time) : null;

        const durationText = timeInMillis ? ` for ${formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : "";

        // Add field for duration if time is specified
        if (timeInMillis) embed.addFields({ name: "Duration", value: durationText });

        const dm = await guildMember
            ?.send(
                `You've been ${this.getTense(type)} ${inOrFromBoolean} ${guild.name}${durationText} for reason \`${reason}\` (case #${punData._id})`,
            )
            .catch(() => void embed.setFooter({ text: "Failed to DM member of punishment" }));

        switch (type) {
            case "ban": {
                const banned = await guild.bans.fetch(user).catch(() => null);

                punResult = banned
                    ? "User is already banned."
                    : await guild.bans.create(user, { reason: auditLogReason }).catch((err: Error) => err.message);

                break;
            }
            case "softban": {
                const banned = await guild.bans.fetch(user).catch(() => null);

                punResult = banned
                    ? "User is already banned."
                    : await guild.bans
                          .create(user, { reason: auditLogReason, deleteMessageSeconds: 86_400 })
                          .catch((err: Error) => err.message);

                break;
            }
            case "kick": {
                punResult = await guildMember?.kick(auditLogReason).catch((err: Error) => err.message);

                break;
            }
            case "detain": {
                await guildMember?.voice.disconnect();

                punResult = await guildMember?.roles
                    .add(_client.config.mainServer.roles.detained, auditLogReason)
                    .catch((err: Error) => err.message);

                break;
            }
            case "mute": {
                punResult = guildMember?.communicationDisabledUntil
                    ? "Member is already muted."
                    : await guildMember?.timeout(timeInMillis, auditLogReason).catch((err: Error) => err.message);

                break;
            }
        }

        // If type was softban and it was successful, continue with softban (unban)
        if (type === "softban" && typeof punResult !== "string")
            punResult = await guild.bans.remove(user, auditLogReason).catch((err: Error) => err.message);

        if (timeInMillis && ["mute", "ban"].includes(type)) {
            // If type is mute or ban, specify duration and endTime
            punData.endTime = now + timeInMillis;
            punData.duration = timeInMillis;
        }

        if (typeof punResult === "string") {
            // Punishment was unsuccessful
            await dm?.delete();

            return interaction ? await interaction.editReply(punResult) : punResult;
        } else {
            // Punishment was successful
            await Promise.all([this.makeModlogEntry(punData), this.data.create(punData)]);

            if (punData.endTime) this.setExec(punData._id, punData.endTime - Date.now());

            return interaction ? await interaction.editReply({ embeds: [embed] }) : punResult;
        }
    }

    public async removePunishment(caseId: number, moderator: string, reason: string, interaction?: ChatInputCommandInteraction<"cached">) {
        const now = Date.now();
        const punishment = await this.data.findById(caseId);

        if (!punishment) {
            return interaction
                ? await interaction.reply(`Case #${caseId} not found`)
                : log("Red", `Case #${caseId} not found in punishment removal`);
        }

        const guild = this._client.mainGuild();
        const auditLogReason = `${reason} | Case #${punishment._id}`;
        const [user, guildMember, _id] = await Promise.all([
            this._client.users.fetch(punishment.member._id),
            guild.members.fetch(punishment.member._id).catch(() => null),
            this.createId(),
        ]);
        const removePunishmentData: PunishmentsDocument = {
            type: `un${punishment.type}`,
            _id,
            cancels: punishment._id,
            member: punishment.member,
            reason,
            moderator,
            time: now,
        };
        let punResult;

        switch (punishment.type) {
            case "ban": {
                punResult = await guild.bans.remove(punishment.member._id, auditLogReason).catch((err: Error) => err.message);

                break;
            }
            case "softban": {
                removePunishmentData.type = "removeOtherPunishment";

                break;
            }
            case "kick": {
                removePunishmentData.type = "removeOtherPunishment";

                break;
            }
            case "detain": {
                punResult = await guildMember?.roles
                    .remove(this._client.config.mainServer.roles.detained, auditLogReason)
                    .catch((err: Error) => err.message);

                break;
            }
            case "mute": {
                if (!guildMember) {
                    await this.data.findByIdAndUpdate(caseId, { expired: true }, { new: true });

                    break;
                }

                await guildMember.send(`You've been unmuted in ${guild.name}.`).catch((err: Error) => console.log(err.message));

                punResult = await guildMember.timeout(null, auditLogReason).catch((err: Error) => err.message);
            }
        }

        // Unpunish was unsuccessful
        if (typeof punResult === "string") return interaction ? await interaction.reply(punResult) : punResult;

        // Unpunish was successful
        await Promise.all([
            this.data.findByIdAndUpdate(caseId, { expired: true }, { new: true }),
            this.data.create(removePunishmentData),
            this.makeModlogEntry(removePunishmentData),
        ]);

        return interaction
            ? await interaction.reply({
                  embeds: [
                      new EmbedBuilder()
                          .setColor(this._client.config.EMBED_COLOR)
                          .setTitle(`Case #${removePunishmentData._id}: ${formatString(removePunishmentData.type)}`)
                          .setDescription(`${user.tag}\n${user}\n(\`${user.id}\`)`)
                          .addFields({ name: "Reason", value: reason }, { name: "Overwrites", value: `Case #${punishment._id}` }),
                  ],
              })
            : `Successfully un${this.getTense(punishment.type)} ${user.tag} (${user.id}) for reason "${reason}"`;
    }
}
