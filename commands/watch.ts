import { SlashCommandBuilder } from 'discord.js';
import fs from 'node:fs';
import { TInteraction } from '../typings.js';
import { isMPStaff, youNeedRole } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        if (!isMPStaff(interaction.member)) return youNeedRole(interaction, "mpstaff");

        const name = interaction.options.getString('username', false) as string;
        const wlData = await interaction.client.watchList.data.findById(name);

        ({
            add: async () => {
                const reason = interaction.options.getString('reason', true);
                if (!wlData) {
                    await interaction.client.watchList.data.create({ _id: name, reason });
                    interaction.reply(`Successfully added \`${name}\` with reason \`${reason}\``);
                } else interaction.reply(`\`${name}\` already exists for reason \`${wlData.reason}\``);
            },
            remove: async () => {
                if (wlData) {
                    await interaction.client.watchList.data.findByIdAndDelete(name);
                    interaction.reply(`Successfully removed \`${name}\` from watchList`);
                } else interaction.reply(`\`${name}\` doesn't exist on watchList`);
            },
            view: async () => {
                fs.writeFileSync('../databases/watchListCache.json', JSON.stringify(await interaction.client.watchList.data.find(), null, 2));
                interaction.reply({ files: ['../databases/watchListCache.json'] });
            }
        } as any)[interaction.options.getSubcommand()]();
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Manage watchList names")
        .addSubcommand(x=>x
            .setName('add')
            .setDescription('add a player to watchList')
            .addStringOption(x=>x
                .setName('username')
                .setDescription('The player name to add')
                .setRequired(true))
            .addStringOption(x=>x
                .setName('reason')
                .setDescription('The reason for adding the player')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('remove')
            .setDescription('remove a player from watchList')
            .addStringOption(x=>x
                .setName('username')
                .setDescription('The player name to remove')
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('view')
            .setDescription('View the full watchList'))
};
