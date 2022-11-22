import Discord, { SlashCommandBuilder } from 'discord.js';
import { YClient } from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, "mpstaff");
        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.loa)) {
            interaction.member.roles.add(client.config.mainServer.roles.loa);
            setTimeout(() => interaction.member.roles.remove(client.config.mainServer.roles.mpstaff), 500);
            setTimeout(() => interaction.member.setNickname(`[LOA] ${interaction.member.nickname}`).catch(() => console.log('failed to set nickname for LOA')), 1000);
            setTimeout(() => interaction.reply({content: 'LOA status set', ephemeral: true}), 1500);
        } else {
            interaction.member.roles.add(client.config.mainServer.roles.mpstaff);
            setTimeout(() => interaction.member.roles.remove(client.config.mainServer.roles.loa), 500);
            setTimeout(() => interaction.member.setNickname(`${interaction.member.nickname?.replaceAll('[LOA] ', '')}`).catch(() => console.log('failed to set nickname for LOA')), 1000);
            setTimeout(() => interaction.reply({content: 'LOA status removed', ephemeral: true}), 1500);
        }
	},
	data: new SlashCommandBuilder()
        .setName("loa")
        .setDescription("Set yourself as LOA")
};