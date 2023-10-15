import { SlashCommandBuilder } from 'discord.js';
import FTPClient from 'ftp';
import fs from 'node:fs';
import config from '../config.json' assert { type: 'json' };
import { FSServers, isMPStaff, youNeedRole } from '../utilities.js';
import { TInteraction } from '../typings.js';

const fsServers = new FSServers(config.fs);

export default {
	async run(interaction: TInteraction) {
        const whitelist = ['984568108704497694', '200066407415676928'];
        const chosenServer = interaction.options.getString('server', true);

        if (!isMPStaff(interaction.member) && !whitelist.includes(interaction.user.id)) return await youNeedRole(interaction, 'mpstaff');

        const FTP = new FTPClient();
        await interaction.deferReply({ ephemeral: true });
        
        FTP.on('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'blockedUserIds.xml', async (err, stream) => {
            if (err) return await interaction.editReply(err.message);
    
            stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
            stream.once('close', async () => {
                FTP.end();
                await interaction.editReply({ files: ['../databases/blockedUserIds.xml'] });
            });
        })).connect(fsServers.getPublicOne(chosenServer).ftp);
	},
	data: new SlashCommandBuilder()
		.setName("uf")
		.setDescription("Allows select members to download ban lists")
        .addStringOption(x => x
            .setName('server')
            .setDescription('The server to download bans from')
            .addChoices(...fsServers.getPublicAll().map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro })))
            .setRequired(true))
};
