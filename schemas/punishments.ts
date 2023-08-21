import mongoose from 'mongoose';
import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';
import ms from 'ms';
import { formatTime, log } from '../utilities.js';

const model = mongoose.model('punishments', new mongoose.Schema({
    _id: { type: Number, required: true },
    type: { type: String, required: true },
    member: { required: true, type: new mongoose.Schema({
        _id: { type: String, required: true },
        tag: { type: String, required: true }
    }) },
    moderator: { type: String, required: true },
    expired: { type: Boolean },
    time: { type: Number, required: true },
    reason: { type: String, required: true },
    endTime: { type: Number },
    cancels: { type: Number },
    duration: { type: Number }
}, { versionKey: false }));

type Document = ReturnType<typeof model.castObject>;

export default class Punishments {
    public data = model;

    constructor(private client: YClient) { }

    public setExec(_id: number, timeout: number) {
        setTimeout(async() => {
            if (timeout > 2_147_483_647) return this.setExec(_id, timeout - 2_147_483_647);
            
            const punishment = await this.data.findById(_id);

            if (!punishment) return;

            log('Yellow', `${punishment.member.tag}\'s ${punishment.type} (case #${punishment._id}) should expire now`);
        	this.removePunishment(punishment._id, this.client.user.id, "Time\'s up!").then(result => log('Yellow', result));
        }, timeout > 2_147_483_647 ? 2_147_483_647 : timeout);
    }

	private async makeModlogEntry(punishment: Document) {
        const embed = new EmbedBuilder()
            .setTitle(`${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment._id}`)
            .addFields(
            	{ name: '🔹 User', value: `${punishment.member.tag}\n<@${punishment.member._id}>\n\`${punishment.member._id}\``, inline: true },
            	{ name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
            	{ name: '\u200b', value: '\u200b', inline: true },
            	{ name: '🔹 Reason', value: `\`${punishment.reason}\``, inline: true })
            .setColor(this.client.config.embedColor)
            .setTimestamp(punishment.time);

        if (punishment.duration) embed.addFields(
            { name: '🔹 Duration', value: formatTime(punishment.duration, 100), inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
        );
		
        if (punishment.cancels) {
            const cancels = await this.data.findById(punishment.cancels);

            embed.addFields({ name: '🔹 Overwrites', value: `This case overwrites Case #${cancels?._id} \`${cancels?.reason}\`` });
        }
    
        this.client.getChan('staffReports').send({ embeds: [embed] });
    };

    private async createId() {
        return Math.max(...(await this.data.find()).map(x => x._id), 0) + 1;
    }

    /** Get past tense form of punishment type */
	private getTense(type: string) {
		return {
			ban: 'banned',
			softban: 'softbanned',
			kick: 'kicked',
			detain: 'detained',
			mute: 'muted',
			warn: 'warned'
		}[type];
	}

	public async addPunishment(
        type: string,
        moderator: string,
        reason: string,
        User: Discord.User,
        GuildMember: Discord.GuildMember | null,
        options: {
            time?: string,
            interaction?: Discord.ChatInputCommandInteraction<"cached">
        }
    ) {
		const { time, interaction } = options;
		const now = Date.now();
		const guild = this.client.mainGuild();
		const punData: Document = { type, _id: await this.createId(), member: { tag: User.tag, _id: User.id }, reason, moderator, time: now };
		const inOrFromBoolean = ['warn', 'mute'].includes(type) ? 'in' : 'from'; // Use 'in' if the punishment doesn't remove the member from the server, eg. mute, warn
		const auditLogReason = `${reason} | Case #${punData._id}`;
		const embed = new EmbedBuilder()
			.setColor(this.client.config.embedColor)
			.setTitle(`Case #${punData._id}: ${type[0].toUpperCase() + type.slice(1)}`)
			.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
			.addFields({ name: 'Reason', value: reason });
		let punResult: Discord.User | Discord.GuildMember | string | null | undefined;
		let timeInMillis: number | null;
		let DM;

		if (type === "mute") {       
            const parsedTime = time ? ms(time) : 2_073_600_000;

            if (parsedTime > 2_073_600_000) return interaction?.editReply('You cannot mute someone for longer than 24 days.');

			timeInMillis = parsedTime;
		} else timeInMillis = time ? ms(time) : null;

		const durationText = timeInMillis ? ` for ${formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : '';

		// Add field for duration if time is specified
		if (timeInMillis) embed.addFields({ name: 'Duration', value: durationText });

		if (GuildMember) {
			try {
				DM = await GuildMember.send(`You've been ${this.getTense(type)} ${inOrFromBoolean} ${guild.name}${durationText} for reason \`${reason}\` (case #${punData._id})`);
			} catch (err: any) {
				embed.setFooter({ text: 'Failed to DM member of punishment' });
			}
		}

        punResult = await ({
            ban: async () => {
                const banned = await guild.bans.fetch(User).catch(() => null);

                if (banned) {
                    return 'User is already banned.';
                } else return await guild.bans.create(User, { reason: auditLogReason }).catch((err: Error) => err.message);
            },
            softban: async () => {
                const banned = await guild.bans.fetch(User).catch(() => null);

                if (banned) {
                    return 'User is already banned.';
                } else return await guild.bans.create(User, { reason: auditLogReason, deleteMessageSeconds: 86400 }).catch((err: Error) => err.message);
            },
            kick: async () => {
                return await GuildMember?.kick(auditLogReason).catch((err: Error) => err.message);
            },
            detain: async () => {
                return await GuildMember?.roles.add(this.client.config.mainServer.roles.detained, auditLogReason).catch((err: Error) => err.message);
            },
            mute: async () => {
                if (GuildMember?.communicationDisabledUntil) {
                    return 'Member is already muted.';
                } else return await GuildMember?.timeout(timeInMillis, auditLogReason).catch((err: Error) => err.message);
            }
        } as any)[type]();

		// If type was softban and it was successful, continue with softban (unban)
		if (type === 'softban' && typeof punResult !== 'string') punResult = await guild.bans.remove(User.id, auditLogReason).catch((err: Error) => err.message);

		if (timeInMillis && ['mute', 'ban'].includes(type)) { // If type is mute or ban, specify duration and endTime
			punData.endTime = now + timeInMillis;
			punData.duration = timeInMillis;
		}

		if (typeof punResult === 'string') { // Punishment was unsuccessful
			DM?.delete();
            
			if (interaction) {
				return interaction.editReply(punResult);
			} else return punResult;
		} else { // Punishment was successful
			await Promise.all([
				this.makeModlogEntry(punData),
				this.data.create(punData)
			]);

            if (punData.endTime) this.setExec(punData._id, punData.endTime - Date.now());

			if (interaction) {
				return interaction.editReply({ embeds: [embed] });
			} else return punResult;
		}
	}


	public async removePunishment(caseId: number, moderator: string, reason: string, interaction?: Discord.ChatInputCommandInteraction<"cached">) {
		const now = Date.now();
		const punishment = await this.data.findById(caseId);

		if (!punishment) return;

		const guild = this.client.mainGuild();
		const auditLogReason = `${reason} | Case #${punishment._id}`;
		const [User, GuildMember, _id] = await Promise.all([
			this.client.users.fetch(punishment.member._id),
			guild.members.fetch(punishment.member._id).catch(() => null),
			this.createId()
		]);
		let removePunishmentData: Document = { type: `un${punishment.type}`, _id, cancels: punishment._id, member: punishment.member, reason, moderator, time: now };
        let punResult: Discord.User | Discord.GuildMember | string | null | undefined;

        punResult = await ({
            ban: async () => {
                return await guild.bans.remove(punishment.member._id, auditLogReason).catch((err: Error) => err.message);
            },
            softban: () => {
                removePunishmentData.type = 'removeOtherPunishment';
            },
            kick: () => {
                removePunishmentData.type = 'removeOtherPunishment';
            },
            detain: async () => {
                return await GuildMember?.roles.remove(this.client.config.mainServer.roles.detained, auditLogReason).catch((err: Error) => err.message);
            },
            mute: async () => {
                if (GuildMember) {
                    GuildMember.send(`You've been unmuted in ${guild.name}.`).catch((err: Error) => console.log(err.message));
                    return await GuildMember.timeout(null, auditLogReason).catch((err: Error) => err.message);
                } else await this.data.findByIdAndUpdate(caseId, { expired: true }, { new: true });
            },
            warn: () => {
                removePunishmentData.type = 'removeOtherPunishment';
            }
        } as any)[punishment.type]();

		if (typeof punResult === 'string') { // Unpunish was unsuccessful
			if (interaction) {
				return interaction.reply(punResult);
			} else return punResult;
		} else { // Unpunish was successful
			await Promise.all([
				this.data.findByIdAndUpdate(caseId, { expired: true }, { new: true }),
				this.data.create(removePunishmentData),
				this.makeModlogEntry(removePunishmentData)
			]);

			if (interaction) {
				return interaction.reply({ embeds: [new EmbedBuilder()
					.setColor(this.client.config.embedColor)
					.setTitle(`Case #${removePunishmentData._id}: ${removePunishmentData.type[0].toUpperCase() + removePunishmentData.type.slice(1)}`)
					.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
					.addFields(
						{ name: 'Reason', value: reason },
						{ name: 'Overwrites', value: `Case #${punishment._id}` })
				] });
			} else return `Successfully un${this.getTense(punishment.type)} ${User.tag} (${User.id}) for reason '${reason}'`;
		}
	}
}