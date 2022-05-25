const { SlashCommandBuilder, ButtonBuilder } = require("@discordjs/builders");
const { MessageButton, MessageActionRow } = require("discord.js");

module.exports = {
	run: async (client, interaction) => {
        if(!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.dfmanager) && !interaction.member.roles.cache.has(client.config.mainServer.roles.dffarmowner)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpmanager}> role to use this command.`, allowedMentions: {roles: false}})
        const member = interaction.options.getMember("member");
        const options = interaction.options.getString("role");
        let Role;

        if (options === 'green') {
            Role = client.config.mainServer.roles.dfgreen;
        } else if (options === 'blue') {
            Role = client.config.mainServer.roles.dfblue;
        } else if (options === 'orange') {
            Role = client.config.mainServer.roles.dforange;
        } else if (options === 'yellow') {
            Role = client.config.mainServer.roles.dfyellow;
        }
        if(member.roles.cache.has(Role)){
            const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new MessageActionRow().addComponents(new MessageButton().setCustomId(`Yes`).setStyle("SUCCESS").setLabel("Confirm"), new MessageButton().setCustomId(`No`).setStyle("DANGER").setLabel("Cancel"))]});
            const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000});
            collector.on("collect", async (int) => {
                if(int.customId === "Yes"){
                    member.roles.remove(Role);
                    member.roles.remove(client.config.mainServer.roles.dfmember);
                    member.roles.remove(client.config.mainServer.roles.dfpass);
                    int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from the <@&${client.config.mainServer.roles.dfmember}>, <@&${client.config.mainServer.roles.dfpass}>, and<@&${Role}> roles.`).setColor(client.config.embedColor)], components: []})
                } else if(int.customId === "No"){
                    int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                }
            });
        } else {
            member.roles.add(Role);
            member.roles.add(client.config.mainServer.roles.dfmember);
            interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given the <@&${client.config.mainServer.roles.dfmember}> and <@&${Role}> roles.`).setColor(client.config.embedColor)]});
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
        .addChoice('DF Green', 'green')
        .addChoice('DF Blue', 'blue')
        .addChoice('DF Orange', 'orange')
        .addChoice('DF Yellow', 'yellow')
        .setRequired(true))
};
