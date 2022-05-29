const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders");
const { MessageButton, MessageActionRow } = require("discord.js");

module.exports = {
	run: async (client, interaction) => {
        if(!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.rfmanager)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.rfmanager}> role to use this command.`, allowedMentions: {roles: false}})
        const member = interaction.options.getMember("member");
        const options = interaction.options.getString("role");
        let Role;

        if (options === 'pink') {
            Role = client.config.mainServer.roles.rfpink;
        } else if (options === 'purple') {
            Role = client.config.mainServer.roles.rfpurple;
        } else if (options === 'lightblue') {
            Role = client.config.mainServer.roles.rflightblue;
        } else if (options === 'darkblue') {
            Role = client.config.mainServer.roles.rfdarkblue;
        } else if (options === 'orange') {
            Role = client.config.mainServer.roles.rforange;
        } else if (options === 'red') {
            Role = client.config.mainServer.roles.rfred;
        }
        if(member.roles.cache.has(Role)){
            const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new MessageActionRow().addComponents(new MessageButton().setCustomId(`Yes`).setStyle("SUCCESS").setLabel("Confirm"), new MessageButton().setCustomId(`No`).setStyle("DANGER").setLabel("Cancel"))]});
            const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000});
            collector.on("collect", async (int) => {
                if(int.customId === "Yes"){
                    member.roles.remove(Role);
                    member.roles.remove(client.config.mainServer.roles.rfmember);
                    int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from the <@&${client.config.mainServer.roles.rfmember}> and<@&${Role}> roles.`).setColor(client.config.embedColor)], components: []})
                } else if(int.customId === "No"){
                    int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                }
            });
        } else {
            member.roles.add(Role);
            member.roles.add(client.config.mainServer.roles.rfmember);
            interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given the <@&${client.config.mainServer.roles.rfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)]});
        }
	},
    data: new SlashCommandBuilder()
    .setName("rf")
    .setDescription("Manage RF members")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add or remove the role from")
        .setRequired(true))
    .addStringOption((opt)=>opt
        .setName("role")
        .setDescription("the role to add or remove")
        .addChoices(
            {name: 'RF pink', value: 'pink'},
            {name: 'RF Purple', value: 'purple'},
            {name: 'RF Light Blue', value: 'lightblue'},
            {name: 'RF Dark Blue', value: 'darkblue'},
            {name: 'RF Orange', value: 'orange'},
            {name: 'RF Red', value: 'red'},
        )
        .setRequired(true))
};
