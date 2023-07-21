import { SlashCommandBuilder } from 'discord.js';
import { TInteraction } from '../typings.js';
import { isMPStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        if (!isMPStaff(interaction)) return youNeedRole(interaction, "mpstaff");

        const roles = interaction.member.roles.cache.map((x, i) => i);
        const allRoles = interaction.client.config.mainServer.roles;

        if (!roles.includes(allRoles.loa)) {
            await interaction.member.edit({ 
                roles: roles.filter(x=>x != allRoles.mpstaff).concat([allRoles.loa]),
                nick: `[LOA] ${interaction.member.nickname}`
            }).catch(() => interaction.member.roles.set(roles.filter(x=>x != allRoles.mpstaff).concat([allRoles.loa])));

            interaction.reply({ content: 'LOA status set', ephemeral: true });
        } else {
            await interaction.member.edit({ 
                roles: roles.filter(x=>x != allRoles.loa).concat([allRoles.mpstaff]),
                nick: interaction.member.nickname?.replaceAll('[LOA] ', '')
            }).catch(() => interaction.member.roles.set(roles.filter(x=>x != allRoles.loa).concat([allRoles.mpstaff])));

            interaction.reply({ content: 'LOA status removed', ephemeral: true });
        }
	},
	data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Set yourself as LOA")
};