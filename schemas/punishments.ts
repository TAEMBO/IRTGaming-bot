import mongoose from 'mongoose';
import Discord from 'discord.js';
import YClient from '../client.js';
import ms from 'ms';

const Schema = mongoose.model('punishments', new mongoose.Schema({
    _id: { type: Number, required: true },
    type: { type: String, required: true },
    member: { required: true, type: new mongoose.Schema({
        _id: { type: String, required: true },
        tag: { type: String, required: true }
    })},
    moderator: { type: String, required: true },
    expired: { type: Boolean },
    time: { type: Number, required: true },
    reason: { type: String, required: true },
    endTime: { type: Number },
    cancels: { type: Number },
    duration: { type: Number }
}, { versionKey: false }));
const DocType = Schema.castObject(Schema);

export default class punishments extends Schema {
    public _content = Schema;
	private createId = async () => Math.max(...(await this._content.find()).map(x => x.id), 0) + 1;
    constructor(private client: YClient) {
		super();
	}
	async makeModlogEntry(punishment: typeof DocType) {
        const embed = new this.client.embed()
            .setTitle(`${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment._id}`)
            .addFields(
            	{ name: '🔹 User', value: `${punishment.member.tag}\n<@${punishment.member._id}>\n\`${punishment.member._id}\``, inline: true },
            	{ name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
            	{ name: '\u200b', value: '\u200b', inline: true },
            	{ name: '🔹 Reason', value: `\`${punishment.reason}\``, inline: true })
            .setColor(this.client.config.embedColor)
            .setTimestamp(punishment.time);
        if (punishment.duration) embed.addFields({ name: '🔹 Duration', value: this.client.formatTime(punishment.duration, 100), inline: true }, { name: '\u200b', value: '\u200b', inline: true });
		
        if (punishment.cancels) {
            const cancels = await this._content.findById(punishment.cancels);
            embed.addFields({ name: '🔹 Overwrites', value: `This case overwrites Case #${cancels?._id} \`${cancels?.reason}\`` });
        }
    
        (this.client.channels.cache.get(this.client.config.mainServer.channels.staffReports) as Discord.TextChannel).send({embeds: [embed]});
    };
	getTense (type: string) { // Get past tense form of punishment type, grammar yes
		return {
			ban: 'banned',
			softban: 'softbanned',
			kick: 'kicked',
			detain: 'detained',
			mute: 'muted',
			warn: 'warned'
		}[type];
	}
	async addPunishment(type: string, moderator: string, reason: string, User: Discord.User, GuildMember: Discord.GuildMember | null, options: { time?: string, interaction?: Discord.ChatInputCommandInteraction<"cached">}) {
		const { time, interaction } = options;
		const now = Date.now();
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const punData: typeof DocType = { type, _id: await this.createId(), member: { tag: User.tag, _id: User.id }, reason, moderator, time: now };
		const inOrFromBoolean = ['warn', 'mute'].includes(type) ? 'in' : 'from'; // Use 'in' if the punishment doesn't remove the member from the server, eg. mute, warn
		const auditLogReason = `${reason} | Case #${punData._id}`;
		const embed = new this.client.embed()
			.setColor(this.client.config.embedColor)
			.setTitle(`Case #${punData._id}: ${type[0].toUpperCase() + type.slice(1)}`)
			.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
			.addFields({ name: 'Reason', value: reason });
		let punResult;
		let timeInMillis: number | null;
		let DM;

		if (type === "mute") {
			timeInMillis = time ? ms(time) : 2419140000; // Timeouts have a limit of 4 weeks
		} else timeInMillis = time ? ms(time) : null;

		const durationText = timeInMillis ? ` for ${this.client.formatTime(timeInMillis, 4, { longNames: true, commas: true })}` : '';

		// Add field for duration if time is specified
		if (timeInMillis) embed.addFields({ name: 'Duration', value: durationText });

		if (GuildMember) {
			try {
				DM = await GuildMember.send(`You've been ${this.getTense(type)} ${inOrFromBoolean} ${guild.name}${durationText} for reason \`${reason}\` (case #${punData._id})`);
			} catch (err: any) {
				embed.setFooter({text: 'Failed to DM member of punishment'});
			}
		}

		if (['ban', 'softban'].includes(type)) {
			const banned = await guild.bans.fetch(User).catch(() => null);
			if (banned) {
				punResult = 'User is already banned.';
			} else punResult = await guild.bans.create(User, { reason: auditLogReason, deleteMessageSeconds: type === 'softban' ? 86400 : undefined }).catch((err: Error) => err.message);
		} else if (type === 'detain') {
			punResult = await GuildMember?.roles.add(this.client.config.mainServer.roles.detained).catch((err: Error) => err.message);
		} else if (type === 'mute') {
			if (GuildMember?.communicationDisabledUntil) {
				punResult = 'Member is already muted.';
			} else punResult = await GuildMember?.timeout(timeInMillis, auditLogReason).catch((err: Error) => err.message);
		} else if (type === 'kick') punResult = await GuildMember?.kick(auditLogReason).catch((err: Error) => err.message);

		// If type was softban and it was successful, continue with softban (unban)
		if (type === 'softban' && typeof punResult !== 'string') punResult = await guild.bans.remove(User.id, auditLogReason).catch((err: Error) => err.message);

		if (timeInMillis && ['mute', 'ban'].includes(type)) { // If type is mute or ban, specify duration and endTime
			punData.endTime = now + timeInMillis;
			punData.duration = timeInMillis;
		}

		if (typeof punResult === 'string') { // Punishment was unsuccessful
			if (DM) DM.delete();
			if (interaction) {
				return interaction.editReply(punResult);
			} else return punResult;
		} else { // Punishment was successful
			await Promise.allSettled([
				this.makeModlogEntry(punData),
				this._content.create(punData)
			]);

			if (interaction) {
				return interaction.editReply({embeds: [embed]});
			} else return punResult;
		}
	}
	async removePunishment(caseId: number, moderator: string, reason: string, interaction?: Discord.ChatInputCommandInteraction<"cached">) {
		const now = Date.now();
		const punishment = await this._content.findById(caseId);
        if (!punishment) return;
		const guild = this.client.guilds.cache.get(this.client.config.mainServer.id) as Discord.Guild;
		const auditLogReason = `${reason} | Case #${punishment.id}`;
		const User = await this.client.users.fetch(punishment.member._id);
		const GuildMember = await guild.members.fetch(punishment.member._id).catch(() => null);
		
		let removePunishmentData: typeof DocType = { type: `un${punishment.type}`, _id: await this.createId(), cancels: punishment.id, member: punishment.member, reason, moderator, time: now };
		let removePunishmentResult;

		if (punishment.type === 'ban') {
			removePunishmentResult = guild.bans.remove(punishment.member._id, auditLogReason).catch((err: Error) => err.message);
		} else if (punishment.type === 'detain') {
			removePunishmentResult = GuildMember?.roles.remove(this.client.config.mainServer.roles.detained).catch((err: Error) => err.message);
		} else if (punishment.type === 'mute') {
			if (GuildMember) {
				removePunishmentResult = GuildMember.timeout(null, auditLogReason).catch((err: Error) => err.message);
				GuildMember.send(`You've been unmuted in ${guild.name}.`).catch((err: Error) => console.log(err.message));
			} else await this._content.findByIdAndUpdate(caseId, { expired: true }, { new: true });
		} else removePunishmentData.type = 'removeOtherPunishment';

		if (typeof removePunishmentResult === 'string') { // Unpunish was unsuccessful
			if (interaction) {
				return interaction.reply(removePunishmentResult);
			} else return removePunishmentResult;
		} else { // Unpunish was successful
			await Promise.allSettled([
				this._content.findByIdAndUpdate(caseId, { expired: true }, { new: true }),
				this._content.create(removePunishmentData),
				this.makeModlogEntry(removePunishmentData)
			]);

			if (interaction) {
				return interaction.reply({embeds: [new this.client.embed()
					.setColor(this.client.config.embedColor)
					.setTitle(`Case #${removePunishmentData._id}: ${removePunishmentData.type[0].toUpperCase() + removePunishmentData.type.slice(1)}`)
					.setDescription(`${User.tag}\n<@${User.id}>\n(\`${User.id}\`)`)
					.addFields(
						{ name: 'Reason', value: reason },
						{ name: 'Overwrites', value: `Case #${punishment.id}` })
				]});
			} else return `Successfully un${this.getTense(punishment.type)} ${User.tag} (${User.id}) for reason '${reason}'`;
		}
	}
}