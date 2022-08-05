const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
    run: async (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}});
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'add') {
            const name = interaction.options.getString('username');
            const reason = interaction.options.getString('reason') ?? 'N/A';
            let e = false;
            client.watchList._content.forEach((s) => 
                {if (s[0].includes(name)) e = true})
            if (e) return interaction.reply('That name is already exists on the watchList.');
            client.watchList.addData([name, reason]).forceSave();
            interaction.reply({content: `Successfully added \`${name}\` with reason \`${reason}\`.`});
        } else if (subCmd === 'remove') {
            let e = false;
            const name = interaction.options.getString('username');
            client.watchList._content.some((x) => {if (x[0] === name) e = true;})
            if (e) {
                const fs = require('node:fs');
                const path = require("path");
                let arr = require('../databases/watchList.json');

                arr = client.watchList._content.filter((x) => x[0] !== name);
                fs.writeFileSync(path.resolve('./databases/watchList.json'), JSON.stringify(arr))
                client.watchList._content = client.watchList._content = client.watchList._content.filter((x) => x[0] !== name);

                interaction.reply(`Successfully removed \`${name}\` from watchList.`);
            } else return interaction.reply('That name doesn\'t exist on watchList.');
        }
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Watch for someone")
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
                .setRequired(false)))
        .addSubcommand((optt)=>optt
            .setName('remove')
            .setDescription('remove a player from watchList')
            .addStringOption((opt)=>opt
                .setName('username')
                .setDescription('The player name to remove')
                .setRequired(true)))
};