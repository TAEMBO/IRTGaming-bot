const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
    run: async (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}});
        const name = interaction.options.getString('username');
        const reason = interaction.options.getString('reason') ?? 'N/A';

        if (client.watchList._content.forEach((s) => 
            s[0].includes(name))) return interaction.reply('That name is already exists on the watchList.');
        client.watchList.addData([name, reason]).forceSave();
        interaction.reply({content: `Successfully added \`${name}\` with reason \`${reason}\`.`});
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Watch for someone")
        .addStringOption((opt)=>opt
            .setName("username")
            .setDescription("The player name to add")
            .setRequired(true)
        )
        .addStringOption((opt)=>opt
            .setName('reason')
            .setDescription('The reason for adding the player')
            .setRequired(false)
        )
};