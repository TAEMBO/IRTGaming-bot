import { Command } from "#structures";
import { hasRole, isMPStaff, youNeedRole } from "#util";

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

            return await interaction.reply({ content: "LOA status set", ephemeral: true });
        }
        
        const returnedRoles = roles
            .filter(x => x !== configRoles.loa)
            .concat(hasRole(interaction.member, "mpManager")
                ? [configRoles.mpStaff, configRoles.mpManagement]
                : [configRoles.mpStaff]
            );
            
        await interaction.member.edit({
            roles: returnedRoles,
            nick: interaction.member.nickname!.replaceAll("[LOA] ", "")
        }).catch(() => interaction.member.roles.set(returnedRoles));

        await interaction.reply({ content: "LOA status removed", ephemeral: true });
    },
    data: {
        name: "loa",
        description: "Manage your LOA status"
    }
});