
const {SlashCommandBuilder, ButtonBuilder, ActionRowBuilder} = require("discord.js");

module.exports = {
	run: async (client, interaction) => {
        if(!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return interaction.reply({content: `You need the <@&${client.config.mainServer.roles.mpmanager}> role to use this command.`, allowedMentions: {roles: false}})
        const member = interaction.options.getMember("member");
        const owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
        const options = interaction.options.getString("role");
        let Role;

        if (options === 'tf') {
            Role = client.config.mainServer.roles.trustedfarmer;
        } else if (options === 'fm') {
            Role = client.config.mainServer.roles.mpfarmmanager;
        } else if (options === 'pa') {
            Role = client.config.mainServer.roles.mppublicadmin;
        }
        if(member.roles.cache.has(Role)){
            const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle("Success").setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle("Danger").setLabel("Cancel"))]});
            const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000});
            collector.on("collect", async (int) => {
                if(int.customId === "Yes"){
                    member.roles.remove(Role);
                    member.roles.remove(client.config.mainServer.roles.mpstaff);
                    int.update({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been removed from <@&${Role}>.`).setColor(client.config.embedColor)], components: []})
                    await owner.send(`**${interaction.user.tag}** has demoted **${member.user.tag}** from **${interaction.guild.roles.cache.get(Role).name}**`)
                } else if(int.customId === "No"){
                    int.update({embeds: [new client.embed().setDescription(`Command canceled`).setColor(client.config.embedColor)], components: []});
                }
            });
        } else {
            member.roles.add(Role);
            if (Role !== client.config.mainServer.roles.trustedfarmer) {
                member.roles.add(client.config.mainServer.roles.mpstaff)
            }
            await owner.send(`**${interaction.user.tag}** has promoted **${member.user.tag}** to **${interaction.guild.roles.cache.get(Role).name}**`)
            interaction.reply({embeds: [new client.embed().setDescription(`<@${member.user.id}> has been given <@&${Role}>.`).setColor(client.config.embedColor)]});
        }
	},
    data: new SlashCommandBuilder()
    .setName("mp")
    .setDescription("Manage MP members")
    .addUserOption((opt)=>opt
        .setName("member")
        .setDescription("The member to add or remove the role from")
        .setRequired(true))
    .addStringOption((opt)=>opt
        .setName("role")
        .setDescription("the role to add or remove")
        .addChoices(
            {name: 'Trusted Farmer', value: 'tf'},
            {name: 'Farm Manager', value: 'fm'},
            {name: 'Public Admin', value: 'pa'}
        )
        .setRequired(true))
};
