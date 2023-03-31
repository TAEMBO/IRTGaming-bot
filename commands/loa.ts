import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, "mpstaff");
        const roles = interaction.member.roles.cache.map((x, i) => i);

        if (!roles.includes(client.config.mainServer.roles.loa)) {
            await interaction.member.edit({ 
                roles: roles.filter(x=>x != client.config.mainServer.roles.mpstaff).concat([client.config.mainServer.roles.loa]),
                nick: `[LOA] ${interaction.member.nickname}`
            }).catch(() => interaction.member.roles.set(roles.filter(x=>x != client.config.mainServer.roles.mpstaff).concat([client.config.mainServer.roles.loa])));
            interaction.reply({content: 'LOA status set', ephemeral: true});
        } else {
            await interaction.member.edit({ 
                roles: roles.filter(x=>x != client.config.mainServer.roles.loa).concat([client.config.mainServer.roles.mpstaff]),
                nick: interaction.member.nickname?.replaceAll('[LOA] ', '')
            }).catch(() => interaction.member.roles.set(roles.filter(x=>x != client.config.mainServer.roles.loa).concat([client.config.mainServer.roles.mpstaff])));
            interaction.reply({content: 'LOA status removed', ephemeral: true});
        }
	},
	data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Set yourself as LOA")
};