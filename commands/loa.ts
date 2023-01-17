import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, "mpstaff");
        const roles = interaction.member.roles.cache.map((x, i) => i);

        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.loa)) {
            await interaction.member.roles.set(roles.filter(x=>x != client.config.mainServer.roles.mpstaff).concat([client.config.mainServer.roles.loa]));
            await interaction.member.setNickname(`[LOA] ${interaction.member.nickname}`).catch(() => console.log('failed to set nickname for LOA'));
            interaction.reply({content: 'LOA status set', ephemeral: true});
        } else {
            await interaction.member.roles.set(roles.filter(x=>x != client.config.mainServer.roles.loa).concat([client.config.mainServer.roles.mpstaff]));
            await interaction.member.setNickname(`${interaction.member.nickname?.replaceAll('[LOA] ', '')}`).catch(() => console.log('failed to set nickname for LOA'));
            interaction.reply({content: 'LOA status removed', ephemeral: true});
        }
	},
	data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Set yourself as LOA")
};