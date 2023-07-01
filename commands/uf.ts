import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import FTPClient from 'ftp';
import fs from 'node:fs';
import { isMPStaff, youNeedRole } from '../utilities.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const whitelist = ['984568108704497694', '200066407415676928'];
        const chosenServer = interaction.options.getString('server', true) as 'ps' | 'pg';

        if (!isMPStaff(interaction) && !whitelist.includes(interaction.user.id)) return youNeedRole(interaction, 'mpstaff');

        ({
            pg: async () => {
                const FTP = new FTPClient();
                await interaction.deferReply({ ephemeral: true });
            
                FTP.on('ready', () => FTP.get(client.config.ftp.pg.path + 'blockedUserIds.xml', (err, stream) => {
                    if (err) return interaction.editReply(err.message);
    
                    stream.pipe(fs.createWriteStream('../databases/blockedUserIds.xml'));
                    stream.once('close', ()=> {
                        FTP.end();
                        interaction.editReply({ files: ['../databases/blockedUserIds.xml'] })
                    });
                })).connect(client.config.ftp.pg);
            },
            ps: () => {
                interaction.reply({ files: ['../../../Documents/My Games/FarmingSimulator2022/blockedUserIds.xml'], ephemeral: true })
            }
        })[chosenServer]();
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
