const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders");
const { MessageButton, MessageActionRow } = require("discord.js");

module.exports = {
	run: async (client, interaction) => {
        if(!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.dfmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpmanager}> role to use this command.`, allowedMentions: {roles: false}})
        const member = interaction.options.getMember("member");
        const options = interaction.options.getString("role");
        let Role;

        if (options === '1') {
            Role = client.config.mainServer.roles.mffarm1;
        } else if (options === '2') {
            Role = client.config.mainServer.roles.mffarm2;
        } else if (options === '3') {
            Role = client.config.mainServer.roles.mffarm3;
        } else if (options === '4') {
            Role = client.config.mainServer.roles.mffarm4;
        } else if (options === '5') {
            Role = client.config.mainServer.roles.mffarm5;
        } else if (options === '6') {
            Role = client.config.mainServer.roles.mffarm6;
        } else if (options === '7') {
            Role = client.config.mainServer.roles.mffarm7;
        } else if (options === '8') {
            Role = client.config.mainServer.roles.mffarm8;
        } else if (options === '9') {
            Role = client.config.mainServer.roles.mffarm9;
        }
        if(member.roles.cache.has(Role)){
            if (interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner) && !interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(Role)) return interaction.reply('You cannot remove users from a farm you do not own.')
            const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new MessageActionRow().addComponents(new MessageButton().setCustomId(`Yes`).setStyle("SUCCESS").setLabel("Confirm"), new MessageButton().setCustomId(`No`).setStyle("DANGER").setLabel("Cancel"))]});
            const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000});
            collector.on("collect", async (int) => {
                if(int.customId === "Yes"){
                    member.roles.remove(Role);
                    member.roles.remove(client.config.mainServer.roles.mfmember);
                    int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from the <@&${client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)], components: []})
                } else if(int.customId === "No"){
                    int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                }
            });
        } else {
            if (interaction.member.roles.cache.has(client.config.mainServer.roles.mffarmowner) && !interaction.member.roles.cache.has(Role)) return interaction.reply('You cannot add users to a farm you do not own.')
            member.roles.add(Role);
            member.roles.add(client.config.mainServer.roles.mfmember);
            interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given the <@&${client.config.mainServer.roles.mfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)]});
        }
	},
    data: new SlashCommandBuilder()
    .setName("df")
    .setDescription("Manage DF members")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add or remove the role from")
        .setRequired(true))
    .addStringOption((opt)=>opt
        .setName("role")
        .setDescription("the role to add or remove")
        .addChoices(
            {name: 'Farm 1', value: '1'},
            {name: 'Farm 2', value: '2'},
            {name: 'Farm 3', value: '3'},
            {name: 'Farm 4', value: '4'},
            {name: 'Farm 5', value: '5'},
            {name: 'Farm 6', value: '6'},
            {name: 'Farm 7', value: '7'},
            {name: 'Farm 8', value: '8'},
            {name: 'Farm 9', value: '9'},
        )
        .setRequired(true))
};
