const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
    run: async (client, interaction) => {
        if (!client.isMPStaff(client, interaction.member)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpstaff}> role to use this command`, allowedMentions: {roles: false}});
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === "add") {
            const name = interaction.options.getString("username");
            client.TFstaff.addData(name).forceSave();
            interaction.reply({content: `Successfully added \`${name}\``})
        } else if (subCmd === "remove") {
            const fs = require('node:fs');
            const path = require("path");
            const name = interaction.options.getString("username");
            let arr = require('../databases/TFstaff.json');

            arr = client.removeCustomValue(arr, name)
            fs.writeFileSync(path.resolve('./databases/TFstaff.json'), JSON.stringify(arr))
            client.TFstaff._content = require("../databases/TFstaff.json");
    
            interaction.reply({content: `Successfully removed \`${name}\``})
        }
    },
    data: new SlashCommandBuilder()
        .setName("tf")
        .setDescription("Manage TFs")
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