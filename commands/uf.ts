import { SlashCommandBuilder } from 'discord.js';
import FTPClient from 'ftp';
import fs from 'node:fs';
import config from '../config.json' assert { type: 'json' };
import { FSServers, isMPStaff, youNeedRole } from '../utilities.js';
import { TInteraction } from '../typings.js';

const cmdOptionChoices = Object.entries(config.fs)
    .filter(x => !x[1].isPrivate)
    .map(([serverAcro, { fullName }]) => ({ name: fullName, value: serverAcro }));

export default {
	async run(interaction: TInteraction) {
        const whitelist = ['984568108704497694', '200066407415676928'];
        const chosenServer = interaction.options.getString('server', true);
        const fsServers = new FSServers(interaction.client.config.fs);

        if (!isMPStaff(interaction) && !whitelist.includes(interaction.user.id)) return youNeedRole(interaction, 'mpstaff');

        const FTP = new FTPClient();
        await interaction.deferReply({ ephemeral: true });
        
        FTP.on('ready', () => FTP.get(fsServers.getPublicOne(chosenServer).ftp.path + 'blockedUserIds.xml', (err, stream) => {
            if (err) return interaction.editReply(err.message);
    
            stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
            stream.once('close', () => {
                FTP.end();
                interaction.editReply({ files: ['../databases/blockedUserIds.xml'] });
            });
        })).connect(fsServers.getPublicOne(chosenServer).ftp);
	},
	data: new SlashCommandBuilder()
		.setName("uf")
		.setDescription("Allows select members to download ban lists")
        .addStringOption(x=>x
            .setName('server')
            .setDescription('The server to download bans from')
            .addChoices(...cmdOptionChoices)
            .setRequired(true))
};
