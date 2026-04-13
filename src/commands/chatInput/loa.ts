import { Command } from "#structures";
<<<<<<< HEAD
import { fsServers, hasRole, isMPStaff, youNeedRole } from "#util";
=======
import { fsServers, hasRole, isMPStaff, requireConfigRoleId, youNeedRole } from "#util";
>>>>>>> e0ae159 (clean: config validation + crash fixes)
import { MessageFlags } from "discord.js";

export default new Command<"chatInput">({
    async run(interaction) {
        if (!isMPStaff(interaction.member)) return youNeedRole(interaction, "mpStaff");

        const currentRoles = [...interaction.member.roles.cache.keys()];
<<<<<<< HEAD
        const configRoles = interaction.client.config.mainServer.roles;

        if (currentRoles.includes(configRoles.loa)) {
            const returnedRoles = [configRoles.mpStaff];

            if (hasRole(interaction.member, "mpManager")) returnedRoles.push(configRoles.mpManagement);
=======
        const loaRoleId = requireConfigRoleId(interaction.client, "loa");
        const mpStaffRoleId = requireConfigRoleId(interaction.client, "mpStaff");
        const mpManagementRoleId = requireConfigRoleId(interaction.client, "mpManagement");

        if (currentRoles.includes(loaRoleId)) {
            const returnedRoles = [mpStaffRoleId];

            if (hasRole(interaction.member, "mpManager")) returnedRoles.push(mpManagementRoleId);
>>>>>>> e0ae159 (clean: config validation + crash fixes)

            for (const [_, server] of fsServers.getPrivateAll()) {
                if (currentRoles.some(x => server.managerRoles.includes(x))) returnedRoles.push(server.supportRole);
            }

<<<<<<< HEAD
            const finalRoles = currentRoles.concat(returnedRoles).filter(x => x !== configRoles.loa);
=======
            const finalRoles = currentRoles.concat(returnedRoles).filter(x => x !== loaRoleId);
>>>>>>> e0ae159 (clean: config validation + crash fixes)

            await interaction.member.edit({
                roles: finalRoles,
                nick: interaction.member.nickname?.replaceAll("[LOA] ", "")
            }).catch(() => interaction.member.roles.set(finalRoles));

            await interaction.reply({ content: "LOA status removed", flags: MessageFlags.Ephemeral });
        } else {
            const takenRoles = [
<<<<<<< HEAD
                configRoles.mpStaff,
                configRoles.mpManagement,
                ...fsServers.getPrivateAll().map(x => x[1].supportRole)
            ];
            const finalRoles = currentRoles.filter(x => !takenRoles.includes(x)).concat(configRoles.loa);
=======
                mpStaffRoleId,
                mpManagementRoleId,
                ...fsServers.getPrivateAll().map(x => x[1].supportRole)
            ];
            const finalRoles = currentRoles.filter(x => !takenRoles.includes(x)).concat(loaRoleId);
>>>>>>> e0ae159 (clean: config validation + crash fixes)

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
<<<<<<< HEAD
});
=======
});
>>>>>>> e0ae159 (clean: config validation + crash fixes)
