import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { Index, TInteraction } from '../../typings.js';
import { isMPStaff, youNeedRole } from '../../utilities.js';

export default {
	async run(interaction: TInteraction) {
        if (!isMPStaff(interaction.member)) return await youNeedRole(interaction, "mpstaff");

        await ({
            async add() {
                const reason = interaction.options.getString('reason', true);
                const name = interaction.options.getString('username', true);
                const wlData = await interaction.client.watchList.data.findById(name);

                if (!wlData) {
                    await interaction.client.watchList.data.create({ _id: name, reason });
                    await interaction.reply(`Successfully added \`${name}\` with reason \`${reason}\``);
                } else await interaction.reply(`\`${name}\` already exists for reason \`${wlData.reason}\``);
            },
            async remove() {
                const name = interaction.options.getString('username', true);
                const wlData = await interaction.client.watchList.data.findById(name);

                if (wlData) {
                    await interaction.client.watchList.data.findByIdAndDelete(name);
                    await interaction.reply(`Successfully removed \`${name}\` from watchList`);
                } else await interaction.reply(`\`${name}\` doesn't exist on watchList`);
            },
            async view() {
                await interaction.reply({ files: [new AttachmentBuilder(Buffer.from(JSON.stringify(await interaction.client.watchList.data.find(), null, 2)), { name: 'watchListCache.json' })] });
            }
        } as Index)[interaction.options.getSubcommand()]();
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Manage watchList names")
        .addSubcommand(x => x
            .setName('add')
            .setDescription('add a player to watchList')
            .addStringOption(x => x
                .setName('username')
                .setDescription('The player name to add')
                .setRequired(true))
            .addStringOption(x=>x
                .setName('reason')
                .setDescription('The reason for adding the player')
                .setRequired(true)))
        .addSubcommand(x => x
            .setName('remove')
            .setDescription('remove a player from watchList')
            .addStringOption(x => x
                .setName('username')
                .setDescription('The player name to remove')
                .setRequired(true)))
        .addSubcommand(x => x
            .setName('view')
            .setDescription('View the full watchList'))
};
