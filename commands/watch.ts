import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        if (!client.isMPStaff(interaction.member)) return client.youNeedRole(interaction, "mpstaff");
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'add') {
            const name = interaction.options.getString('username') as string;
            const reason = interaction.options.getString('reason');
            let e = false;
            client.watchList._content.forEach((s: Array<string>) => 
                {if (s[0].includes(name)) e = true})
            if (e) return interaction.reply('That name already exists on watchList');
            client.watchList.addData([name, reason]).forceSave();
            interaction.reply({content: `Successfully added \`${name}\` with reason \`${reason}\``});
        } else if (subCmd === 'remove') {
            let e = false;
            const name = interaction.options.getString('username');
            client.watchList._content.some((x: Array<string>) => {if (x[0] === name) e = true;})
            if (e) {
                client.watchList.removeData(name, 1, 0).forceSave();
                interaction.reply(`Successfully removed \`${name}\` from watchList`);
            } else return interaction.reply('That name doesn\'t exist on watchList');
        }
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Manage watchList names")
        .addSubcommand((optt)=>optt
            .setName('add')
            .setDescription('add a player to watchList')
            .addStringOption((opt)=>opt
                .setName('username')
                .setDescription('The player name to add')
                .setRequired(true))
            .addStringOption((opt)=>opt
                .setName('reason')
                .setDescription('The reason for adding the player')
                .setRequired(true)))
        .addSubcommand((optt)=>optt
            .setName('remove')
            .setDescription('remove a player from watchList')
            .addStringOption((opt)=>opt
                .setName('username')
                .setDescription('The player name to remove')
                .setRequired(true)))
};
