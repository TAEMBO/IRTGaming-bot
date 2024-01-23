import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { formatTime } from '../../utils.js';
import { Index } from '../../typings.js';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
		const caseid = interaction.options.getInteger("id");

		await ({
			async view() {
				const punishment = await interaction.client.punishments.data.findById(caseid);

				if (!punishment) return await interaction.reply('A case with that ID wasn\'t found!');

				const cancelledBy = punishment.expired ? await interaction.client.punishments.data.findOne({ cancels: punishment.id }) : null;
				const cancels = punishment.cancels ? await interaction.client.punishments.data.findOne({ _id: punishment.cancels }) : null;
				const embed = new EmbedBuilder()
					.setTitle(`${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment.id}`)
					.addFields(
						{ name: '🔹 User', value: `${punishment.member.tag}\n<@${punishment.member._id}> \`${punishment.member._id}\``, inline: true },
						{ name: '🔹 Moderator', value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
						{ name: '\u200b', value: '\u200b', inline: true },
						{ name: '🔹 Reason', value: `\`${punishment.reason || 'unspecified'}\``, inline: true })
					.setColor(interaction.client.config.EMBED_COLOR)
					.setTimestamp(punishment.time);

				if (punishment.duration) embed.addFields({ name: '🔹 Duration', value: formatTime(punishment.duration, 100), inline: true }, { name: '\u200b', value: '\u200b', inline: true });
				if (punishment.expired) embed.addFields({ name: '🔹 Expired', value: `This case has been overwritten by Case #${cancelledBy?.id} for reason \`${cancelledBy?.reason}\`` });
				if (punishment.cancels) embed.addFields({ name: '🔹 Overwrites', value: `This case overwrites Case #${cancels?.id} \`${cancels?.reason}\`` });

				await interaction.reply({ embeds: [embed] });
			},
			async member() {
				const user = interaction.options.getUser("user", true);
                const pageNumber = interaction.options.getInteger("page") ?? 1;
				const punishments = await interaction.client.punishments.data.find();
                const userPunishmentsData = punishments.filter(x => x.member._id === user.id); 
				const userPunishments = userPunishmentsData.sort((a, b) => a.time - b.time).map(punishment => {
					return {
						name: `${punishment.type[0].toUpperCase() + punishment.type.slice(1)} | Case #${punishment.id}`,
						value: [
							`> Reason: \`${punishment.reason}\``,
							punishment.duration ? `\n> Duration: ${formatTime(punishment.duration, 3)}` : '',
							`\n> Moderator: <@${punishment.moderator}>`,
							punishment.expired ? `\n> __Overwritten by Case #${punishments.find(x => x.cancels === punishment._id)?._id}__` : '',
							punishment.cancels ? `\n> __Overwrites Case #${punishment.cancels}__` : ''].join('')
					}
				});

				if (!userPunishments || !userPunishments.length) return await interaction.reply('No punishments found with that user ID');

				await interaction.reply({ embeds: [new EmbedBuilder()
					.setTitle(`Punishments for ${user.tag}`)
					.setDescription(`<@${user.id}>\n\`${user.id}\``)
					.setFooter({ text: `${userPunishments.length} total punishments. Viewing page ${pageNumber} out of ${Math.ceil(userPunishments.length / 25)}.` })
					.setColor(interaction.client.config.EMBED_COLOR)
					.addFields(userPunishments.slice((pageNumber - 1) * 25, pageNumber * 25))
				] });
			},
			async update() {
				const reason = interaction.options.getString('reason', true);

				await interaction.client.punishments.data.findByIdAndUpdate(caseid, { reason });
				await interaction.reply({ embeds: [new EmbedBuilder().setColor(interaction.client.config.EMBED_COLOR).setTitle(`Case #${caseid} updated`).setDescription(`**New reason:** ${reason}`)] });
			}
		} as Index)[interaction.options.getSubcommand()]();
	},
	data: new SlashCommandBuilder()
		.setName("case")
		.setDescription("Views a member's cases, or a single case ID.")
		.addSubcommand(x => x
			.setName("view")
			.setDescription("Views a single case ID")
			.addIntegerOption(x => x
				.setName("id")
				.setDescription("The ID of the case.")
				.setRequired(true)))
		.addSubcommand(x => x
			.setName("member")
			.setDescription("Views all a members cases")
			.addUserOption(x => x
				.setName("user")
				.setDescription("The user whomm's punishments you want to view.")
				.setRequired(true))
			.addIntegerOption(x => x
				.setName("page")
				.setDescription("The page number.")
				.setRequired(false)))
		.addSubcommand(x => x
			.setName("update")
			.setDescription("Updates a cases reason.")
			.addIntegerOption(x => x
				.setName("id")
				.setDescription("The ID Of The Case To Update.")
				.setRequired(true))
			.addStringOption(x => x
				.setName("reason")
				.setDescription("The New Reason For The Case.")
				.setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
};
