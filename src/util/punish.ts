import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { formatString, formatTime, hasRole, youNeedRole } from "#util";

/**
 * @param interaction The interaction associated with this command
 * @param type The type of punishment this is
 */
export async function punish(interaction: ChatInputCommandInteraction<"cached">, type: string) {
    if (!["warn", "mute"].includes(type) && hasRole(interaction.member, "discordHelper")) return await youNeedRole(interaction, "discordStaff");

    const time = interaction.options.getString("time") ?? undefined;
    const reason = interaction.options.getString("reason") ?? "Unspecified";
    const guildMember = interaction.options.getMember("member");
    const user = interaction.options.getUser("member", true);

    if (interaction.user.id === user.id) return await interaction.reply(`You cannot ${type} yourself!`);
    if (!guildMember && type !== "ban") return await interaction.reply(`You cannot ${type} someone who is not in the server!`);

    await interaction.deferReply();

    let result;

    try {
        result = await interaction.client.punishments.addPunishment(type, interaction.user.id, reason, user, time);
    } catch (err: any) {
        return await interaction.editReply(err.message);
    }

    const { caseDoc, dmSuccess } = result;
    const embed = new EmbedBuilder()
        .setColor(interaction.client.config.EMBED_COLOR)
        .setTitle(`Case #${caseDoc._id}: ${formatString(caseDoc.type)}`)
        .setDescription(`${user.tag}\n${user}\n(\`${user.id}\`)`)
        .setFields({ name: "Reason", value: reason });

    if (caseDoc.duration) embed.addFields({
        name: "Duration",
        value: formatTime(caseDoc.duration, 4, { longNames: true, commas: true })
    });

    if (!dmSuccess) embed.setFooter({ text: "Failed to DM member of punishment" });

    await interaction.editReply({ embeds: [embed] });
}