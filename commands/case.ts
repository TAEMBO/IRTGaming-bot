import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import { db_punishments_format } from '../interfaces';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.hasModPerms(interaction.member as Discord.GuildMember)) return client.youNeedRole(interaction, "mod");

		const caseid = interaction.options.getInteger("id");
		const punishmentsDb = client.punishments._content as Array<db_punishments_format>;

		({
			view: () => {
				const punishment = punishmentsDb.find(x => x.id === caseid);
				if (!punishment) return interaction.reply('A case with that ID wasn\'t found!');
				const cancelledBy = punishment.expired ? punishmentsDb.find(x => x.cancels === punishment.id) : null;
				const cancels = punishment.cancels ? punishmentsDb.find(x => x.id === punishment.cancels) as db_punishments_format : null;
				const embed = new client.embed()
					.setTitle(`${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment.id}`)
					.addFields(
						{name: '🔹 User', value: `${punishment.member.tag}\n<@${punishment.member.id}> \`${punishment.member.id}\``, inline: true},
						{name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true},
						{name: '\u200b', value: '\u200b', inline: true},
						{name: '🔹 Reason', value: `\`${punishment.reason || 'unspecified'}\``, inline: true})
					.setColor(client.config.embedColor)
					.setTimestamp(punishment.time);
				if (punishment.duration) embed.addFields({name: '🔹 Duration', value: client.formatTime(punishment.duration, 100), inline: true}, {name: '\u200b', value: '\u200b', inline: true});
				if (punishment.expired) embed.addFields({name: '🔹 Expired', value: `This case has been overwritten by Case #${cancelledBy?.id} for reason \`${cancelledBy?.reason}\``});
				if (punishment.cancels) embed.addFields({name: '🔹 Overwrites', value: `This case overwrites Case #${cancels?.id} \`${cancels?.reason}\``});
				interaction.reply({embeds: [embed]});
			},
			member: () => {
				const user = interaction.options.getUser("user", true);
				const userPunishments = punishmentsDb.filter(x => x.member.id === user.id).sort((a, b) => a.time - b.time).map(punishment => {
					return {
						name: `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment.id}`,
						value: [
							`> Reason: \`${punishment.reason}\``,
							punishment.duration ? `\n> Duration: ${client.formatTime(punishment.duration, 3)}` : '',
							`\n> Moderator: <@${punishment.moderator}>`,
							punishment.expired ? `\n> __Overwritten by Case #${punishmentsDb.find(x => x.cancels === punishment.id)?.id}__` : '',
							punishment.cancels ? `\n> __Overwrites Case #${punishment.cancels}__` : ''].join('')
					}
				});
				if (!userPunishments || userPunishments.length === 0) return interaction.reply('No punishments found with that user ID');
				const pageNumber = interaction.options.getInteger("page") ?? 1;
				interaction.reply({embeds: [new client.embed()
					.setTitle(`Punishments for ${user.tag}`)
					.setDescription(`<@${user.id}>\n\`${user.id}\``)
					.setFooter({text: `${userPunishments.length} total punishments. Viewing page ${pageNumber} out of ${Math.ceil(userPunishments.length / 25)}.`})
					.setColor(client.config.embedColor)
					.addFields(userPunishments.slice((pageNumber - 1) * 25, pageNumber * 25))
				]});
			},
			update: () => {
				const reason = interaction.options.getString('reason', true);
				(punishmentsDb.find(x=>x.id===caseid) as db_punishments_format).reason = reason;
				client.punishments.forceSave();
				interaction.reply({embeds: [new client.embed().setColor('#00ff00').setTitle('Case updated').setDescription(`Case ${caseid} has been updated\nNew reason: ${reason}`)]});
			}
		} as any)[interaction.options.getSubcommand()]();
	},
	data: new SlashCommandBuilder()
		.setName("case")
		.setDescription("Views a member's cases, or a single case ID.")
		.addSubcommand((optt)=>optt
			.setName("view")
			.setDescription("Views a single case ID")
			.addIntegerOption((opt)=>opt
				.setName("id")
				.setDescription("The ID of the case.")
				.setRequired(true)))
		.addSubcommand((optt)=>optt
			.setName("member")
			.setDescription("Views all a members cases")
			.addUserOption((opt)=>opt
				.setName("user")
				.setDescription("The user whomm's punishments you want to view.")
				.setRequired(true))
			.addIntegerOption((opt)=>opt
				.setName("page")
				.setDescription("The page number.")
				.setRequired(false)))
		.addSubcommand((optt)=>optt
			.setName("update")
			.setDescription("Updates a cases reason.")
			.addIntegerOption((opt)=>opt
				.setName("id")
				.setDescription("The ID Of The Case To Update.")
				.setRequired(true))
			.addStringOption((opt)=>opt
				.setName("reason")
				.setDescription("The New Reason For The Case.")
				.setRequired(true)))
};
