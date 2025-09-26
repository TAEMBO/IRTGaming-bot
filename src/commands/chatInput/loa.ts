import { Command } from "#structures";
import { fs25Servers, hasRole, isMPStaff, youNeedRole } from "#util";
import { MessageFlags } from "discord.js";

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return youNeedRole(interaction, "mpStaff");

        const currentRoles = [...interaction.member.roles.cache.keys()];
        const configRoles = interaction.client.config.mainServer.roles;

        if (currentRoles.includes(configRoles.loa)) {
            const returnedRoles = [configRoles.mpStaff];

            if (hasRole(interaction.member, "mpManager")) returnedRoles.push(configRoles.mpManagement);

            for (const [_, server] of fs25Servers.getPrivateAll()) {
                if (currentRoles.some(x => server.managerRoles.includes(x))) returnedRoles.push(server.supportRole);
            }

            const finalRoles = currentRoles.concat(returnedRoles).filter(x => x !== configRoles.loa);

            await interaction.member.edit({
                roles: finalRoles,
                nick: interaction.member.nickname?.replaceAll("[LOA] ", "")
            }).catch(() => interaction.member.roles.set(finalRoles));

            await interaction.reply({ content: "LOA status removed", flags: MessageFlags.Ephemeral });
        } else {
            const takenRoles = [
                configRoles.mpStaff,
                configRoles.mpManagement,
                ...fs25Servers.getPrivateAll().map(x => x[1].supportRole)
            ];
            const finalRoles = currentRoles.filter(x => !takenRoles.includes(x)).concat(configRoles.loa);

            await interaction.member.edit({
                roles: finalRoles,
                nick: `[LOA] ${interaction.member.nickname}`
            }).catch(() => interaction.member.roles.set(finalRoles));

            await interaction.reply({ content: "LOA status set", flags: MessageFlags.Ephemeral });
        }
    },
    data: {
        name: "loa",
        description: "Manage your LOA status"
    }
});