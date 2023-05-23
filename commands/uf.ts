import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import FTPClient from 'ftp';
import fs from 'node:fs';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const whitelist = ['984568108704497694', '200066407415676928'];
        if (!client.isMPStaff(interaction.member) && !whitelist.includes(interaction.member.id)) return client.youNeedRole(interaction, "mpstaff");
        const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';
        const FTP = new FTPClient();

        if (chosenServer == 'pg') {
            await interaction.deferReply({ ephemeral: true });
            FTP.connect(client.config.ftp.pg);
            FTP.on('ready', () => FTP.get(client.config.ftp.pg.path + 'blockedUserIds.xml', (err, stream) => {
                if (err) return interaction.editReply(err.message);
                stream.once('close', ()=>FTP.end());
                stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));

                setTimeout(() => interaction.editReply({files: ['../databases/blockedUserIds.xml']}), 1000);
            }));
        } else interaction.reply({files: ['../../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml'], ephemeral: true });
	},
	data: new SlashCommandBuilder()
		.setName("uf")
		.setDescription("Allows select members to download ban lists")
        .addStringOption(x=>x
            .setName('server')
            .setDescription('The server to download bans from')
            .addChoices(
                { name: 'Public Silage', value: 'ps' },
                { name: 'Public Grain', value: 'pg' })
            .setRequired(true))
};
