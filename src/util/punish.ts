import type { ChatInputCommandInteraction } from "discord.js"; 
import { hasRole, youNeedRole } from "../utils.js";

/**
 * @param interaction 
 * @param type The type of punishment this is
 */
export async function punish(interaction: ChatInputCommandInteraction<"cached">, type: string) {
    if (!["warn", "mute"].includes(type) && hasRole(interaction.member, "discordhelper")) return await youNeedRole(interaction, "discordstaff");

    const time = interaction.options.getString("time") ?? undefined;
    const reason = interaction.options.getString("reason") ?? "Unspecified";
    const guildMember = interaction.options.getMember("member");
    const user = interaction.options.getUser("member", true);

    if (interaction.user.id === user.id) return await interaction.reply(`You cannot ${type} yourself.`);
    if (!guildMember && type !== "ban") return await interaction.reply(`You cannot ${type} someone who is not in the server.`);

    await interaction.deferReply();
    await interaction.client.punishments.addPunishment(type, interaction.user.id, reason, user, guildMember, { time, interaction });
}