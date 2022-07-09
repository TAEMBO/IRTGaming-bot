const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
    run: async (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}});

        const name = interaction.options.getString("username");
        if (client.watchList._content.includes(name)) return interaction.reply('That username is already on the watchList');
        client.watchList.addData(name).forceSave();
        interaction.reply({content: `Successfully added \`${name}\``});
    },
    data: new SlashCommandBuilder()
        .setName("watch")
        .setDescription("Watch for someone")
        .addStringOption((opt)=>opt
            .setName("username")
            .setDescription("The username to add to db")
            .setRequired(true)
        )
};