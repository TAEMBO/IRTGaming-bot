
const {SlashCommandBuilder, ButtonBuilder, ActionRowBuilder} = require("discord.js");

module.exports = {
	run: async (client, interaction) => {
        if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpstaff)) return client.youNeedRole(interaction, "mpstaff");
        const subCmd = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        switch(subCmd) {
            case "roles":
                if (!interaction.member.roles.cache.has(client.config.mainServer.roles.mpmanager)) return client.youNeedRole(interaction, "mpmanager");
                const member = interaction.options.getMember("member");
                const owner = await interaction.guild.members.fetch(interaction.guild.ownerId);
                const Role = client.config.mainServer.roles[interaction.options.getString("role")];
                
                if(member.roles.cache.has(Role)){
                    const msg = await interaction.reply({embeds: [new client.embed().setDescription(`This user already has the <@&${Role}> role, do you want to remove it from them?`).setColor(client.config.embedColor)], fetchReply: true, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle("Success").setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle("Danger").setLabel("Cancel"))]});
                    const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
                    const collector = msg.createMessageComponentCollector({filter, max: 1, time: 30000});
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
                break;
            case "fm":
                if (client.FMstaff._content.includes(name)) {
                    client.FMstaff.removeData(name, 0, undefined).forceSave();
                    interaction.reply(`Player name already exists, successfully removed \`${name}\``);
                } else {
                    client.FMstaff.addData(name).forceSave();
                    interaction.reply(`Player name doesn't exist, successfully added \`${name}\``);
                }
                break;
            case "tf":
                if (client.TFstaff._content.includes(name)) {
                    client.TFstaff.removeData(name, 0, undefined).forceSave();
                    interaction.reply(`Player name already exists, successfully removed \`${name}\``);
                } else {
                    client.TFstaff.addData(name).forceSave();
                    interaction.reply(`Player name doesn't exist, successfully added \`${name}\``);
                }
                break;
        }
	},
    data: new SlashCommandBuilder()
    .setName("mp")
    .setDescription("Manage MP members")
    .addSubcommand(x=>x
        .setName('roles')
        .setDescription('Give or take MP Staff roles')
        .addUserOption(x=>x
            .setName("member")
            .setDescription("The member to add or remove the role from")
            .setRequired(true))
        .addStringOption(x=>x
            .setName("role")
            .setDescription("the role to add or remove")
            .addChoices(
                {name: 'Trusted Farmer', value: 'trustedfarmer'},
                {name: 'Farm Manager', value: 'mpfarmmanager'},
                {name: 'Public Admin', value: 'mppublicadmin'}
            )
            .setRequired(true)))
    .addSubcommand(x=>x
        .setName('fm')
        .setDescription('Add or remove player names in FM list')
        .addStringOption(x=>x
            .setName('name')
            .setDescription('The player name to add or remove')
            .setRequired(true)))
    .addSubcommand(x=>x
        .setName('tf')
        .setDescription('Add or remove player names in TF list')
        .addStringOption(x=>x
            .setName('name')
            .setDescription('The player name to add or remove')
            .setRequired(true)))
};
