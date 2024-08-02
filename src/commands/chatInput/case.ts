import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "#structures";
import { formatString, formatTime, formatUser, lookup } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const caseid = interaction.options.getInteger("id");

        await lookup({
            async view() {
                const punishment = await interaction.client.punishments.data.findById(caseid);

                if (!punishment) return await interaction.reply("A case with that ID wasn't found!");

                const cancelledBy = punishment.expired ? await interaction.client.punishments.data.findOne({ cancels: punishment.id }) : null;
                const cancels = punishment.cancels ? await interaction.client.punishments.data.findOne({ _id: punishment.cancels }) : null;
                const embed = new EmbedBuilder()
                    .setTitle(`${formatString(punishment.type)} | Case #${punishment.id}`)
                    .addFields(
                        { name: "🔹 User", value: `${punishment.member.tag}\n<@${punishment.member._id}> \`${punishment.member._id}\``, inline: true },
                        { name: "🔹 Moderator", value: `<@${punishment.moderator}> \`${punishment.moderator}\``, inline: true },
                        { name: "\u200b", value: "\u200b", inline: true },
                        { name: "🔹 Reason", value: `\`${punishment.reason || "unspecified"}\``, inline: true })
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setTimestamp(punishment.time);

                if (punishment.duration) embed.addFields({ name: "🔹 Duration", value: formatTime(punishment.duration, 100), inline: true }, { name: "\u200b", value: "\u200b", inline: true });
                if (punishment.expired) embed.addFields({ name: "🔹 Expired", value: `This case has been overwritten by Case #${cancelledBy?.id} for reason \`${cancelledBy?.reason}\`` });
                if (punishment.cancels) embed.addFields({ name: "🔹 Overwrites", value: `This case overwrites Case #${cancels?.id} \`${cancels?.reason}\`` });

                await interaction.reply({ embeds: [embed] });
            },
            async member() {
                const user = interaction.options.getUser("user", true);
                const pageNumber = interaction.options.getInteger("page") ?? 1;
                const punishments = await interaction.client.punishments.data.find();
                const userPunishmentsData = punishments.filter(x => x.member._id === user.id);
                const userPunishments = userPunishmentsData.sort((a, b) => a.time - b.time).map(punishment => ({
                    name: `${formatString(punishment.type)} | Case #${punishment.id}`,
                    value: [
                        `> Reason: \`${punishment.reason}\``,
                        punishment.duration ? `\n> Duration: ${formatTime(punishment.duration, 3)}` : "",
                        `\n> Moderator: <@${punishment.moderator}>`,
                        punishment.expired ? `\n> __Overwritten by Case #${punishments.find(x => x.cancels === punishment._id)?._id}__` : "",
                        punishment.cancels ? `\n> __Overwrites Case #${punishment.cancels}__` : ""].join("")
                }));

                if (!userPunishments || !userPunishments.length) return await interaction.reply("No punishments found with that user ID");

                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setTitle(`Punishments for ${user.tag}`)
                    .setDescription(formatUser(user))
                    .setFooter({ text: `${userPunishments.length} total punishments. Viewing page ${pageNumber} out of ${Math.ceil(userPunishments.length / 25)}.` })
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .addFields(userPunishments.slice((pageNumber - 1) * 25, pageNumber * 25))
                ] });
            },
            async update() {
                const reason = interaction.options.getString("reason", true);

                await interaction.client.punishments.data.findByIdAndUpdate(caseid, { reason });
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(interaction.client.config.EMBED_COLOR).setTitle(`Case #${caseid} updated`).setDescription(`**New reason:** ${reason}`)] });
            }
        }, interaction.options.getSubcommand());
    },
    data: new SlashCommandBuilder()
        .setName("case")
        .setDescription("View a case, or all of a member's cases")
        .addSubcommand(x => x
            .setName("view")
            .setDescription("View a single case")
            .addIntegerOption(x => x
                .setName("id")
                .setDescription("The ID of the case")
                .setRequired(true)))
        .addSubcommand(x => x
            .setName("member")
            .setDescription("View all of a member's cases")
            .addUserOption(x => x
                .setName("user")
                .setDescription("The member whose cases to view")
                .setRequired(true))
            .addIntegerOption(x => x
                .setName("page")
                .setDescription("The page number (if multiple case pages)")
                .setRequired(false)))
        .addSubcommand(x => x
            .setName("update")
            .setDescription("Update a case's reason")
            .addIntegerOption(x => x
                .setName("id")
                .setDescription("The ID of the case")
                .setRequired(true))
            .addStringOption(x => x
                .setName("reason")
                .setDescription("The new reason for the case")
                .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
});
