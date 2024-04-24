import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../structures/index.js";
import { hasRole, isMPStaff, youNeedRole } from "../../util/index.js";

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpStaff");

        const roles = [...interaction.member.roles.cache.keys()];
        const configRoles = interaction.client.config.mainServer.roles;

        if (!roles.includes(configRoles.loa)) {
            const takenRoles = roles.filter(x => x != configRoles.mpStaff && x != configRoles.mpManagement).concat([configRoles.loa]);

            await interaction.member.edit({
                roles: takenRoles,
                nick: `[LOA] ${interaction.member.nickname}`
            }).catch(() => interaction.member.roles.set(takenRoles));

            await interaction.reply({ content: "LOA status set", ephemeral: true });
        } else {
            const returnedRoles = (() => {
                if (hasRole(interaction.member, "mpManager")) {
                    return roles.filter(x => x !== configRoles.loa).concat([configRoles.mpStaff, configRoles.mpManagement]);
                } else return roles.filter(x => x !== configRoles.loa).concat([configRoles.mpStaff]);
            })();
            
            await interaction.member.edit({
                roles: returnedRoles,
                nick: interaction.member.nickname!.replaceAll("[LOA] ", "")
            }).catch(() => interaction.member.roles.set(returnedRoles));

            await interaction.reply({ content: "LOA status removed", ephemeral: true });
        }
    },
    data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Manage your LOA status")
});