const {SlashCommandBuilder} = require('discord.js');

module.exports = { 
    run: async (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}});
        const subCmd = interaction.options.getSubcommand();
        const name = interaction.options.getString("username");

        if (subCmd === "add") {
            if (client.FMstaff._content.includes(name)) return interaction.reply('That username already exists');
            client.FMstaff.addData(name).forceSave();
            interaction.reply({content: `Successfully added \`${name}\``})
        } else if (subCmd === "remove") {
            if (!client.FMstaff._content.includes(name)) return interaction.reply('That username doesn\'t exist');
            client.FMstaff.removeData(name, 0, undefined).forceSave();
            interaction.reply({content: `Successfully removed \`${name}\``})
        }
    },
    data: new SlashCommandBuilder()
        .setName("fm")
        .setDescription("Manage FMs")
        .addSubcommand((optt)=>optt
            .setName("add")
            .setDescription("Add a username to db")
            .addStringOption((opt)=>opt
                .setName("username")
                .setDescription("The username to add to db")
                .setRequired(true))
        )
        .addSubcommand((optt)=>optt
            .setName("remove")
            .setDescription("Remove a username from db")
            .addStringOption((opt)=>opt
                .setName("username")
                .setDescription("The username to remove from db")
                .setRequired(true))
        )
};