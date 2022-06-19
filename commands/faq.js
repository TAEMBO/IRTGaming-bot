const { SlashCommandBuilder } = require("@discordjs/builders");
const {MessageActionRow, MessageButton} = require("discord.js");

module.exports = { 
    run: async (client, interaction) => {
        const subCmd = interaction.options.getSubcommand();

        if (subCmd === 'staff') {
            interaction.reply({components: [new MessageActionRow().addComponents(new MessageButton().setStyle("LINK").setURL(`https://canary.discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))]})
        } else if (subCmd === 'troll') {
            interaction.reply({embeds: [new client.embed()
                .setTitle('Reporting trolls')
                .addFields(
                    {name: 'In a hurry to report?', value: `Go to <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> and type:\n\n<@&${client.config.mainServer.roles.mpstaff}> **(**troll's name**) (**what they're doing**) (**picture or video if possible**)**`},
                    {name: 'Want the full gist?', value: `While playing on the public servers, you may come across the odd player misbehaving and messing things up. If you do, please report them in <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> along with a short description of what they're doing and tag <@&${client.config.mainServer.roles.mpstaff}>.`},
                    {name: 'Notes', value: `> When reporting a player, please include a name or screenshot/video including the name. Staff can't help if they don't know who to look out for.\n\n> Please do not tag individual staff members unless they are already on the server. If they're not on the server and possibly not available, then it will take longer for an online staff member to handle it.`})
                .setImage('https://cdn-longterm.mee6.xyz/plugins/commands/images/552565546089054218/a0857b5fec15fd24c8f2b5583e631f180d9b02919dfa8e935c44b49f91381d49.jpeg')
                .setColor(client.config.embedColor)]})
        } else if (subCmd === 'appeal') {
            interaction.reply({embeds: [new client.embed().setDescription('To appeal a ban on a server, go to <#825046442300145744> to create a ticket. Within the ticket, type `!appeal`.').setColor(client.config.embedColor)]})
        } else if (subCmd === 'trusted') {
            interaction.reply({embeds: [new client.embed()
                .setDescription(`Within our servers, you may see a farm that has a password on it with someone possibly in it. Unless the password to the farm is posted in its respective channel for the server, it's safe to assume that the farm is for <@&${client.config.mainServer.roles.trustedfarmer}>s and higher. This is done to prevent trolls from using equipment maliciously. If you're wondering on how to get <@&${client.config.mainServer.roles.trustedfarmer}>, you need to be active and helpful on the servers for an extended period of time.\n> Please note that the green farm with our Discord invite should never have a password set, it is the main farm that everyone should use`).setColor(client.config.embedColor)]})
        } else if (subCmd === 'filters') {
            interaction.reply('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')
        } else if (subCmd === 'todo') {
            const embed = new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .addFields(
                    {name: 'Public Silage', value: `> For <#${client.config.mainServer.channels.fs22_silage}>, things you can do on the server are: \n- Harvest corn\n- Replant fields with *corn*\n- Cut grass in any area that has grown grass\n- Pick up cut grass\n- Run silage from the bunkers to the Animal Dealer north of field 7\n- Tidy up the yard`},
                    {name: 'Public Grain', value: `> For <#${client.config.mainServer.channels.fs22_grain}>, things you can do on the server are: \n- Harvest crops on fields\n- Replant fields with any crop __other than *oilseed radish* and *grass*__\n- Run grain trailers from the fields being harvested to sellpoints like Straig Lager or Supermarket\n- Tidy up the yard`}
                )
            .setFooter({text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing'})
            interaction.reply({embeds: [embed]})
        }
    },
    data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Frequently asked questions")
    .addSubcommand((optt)=>optt
        .setName("staff")
        .setDescription("FAQ: Applying for MP Staff")
    )
    .addSubcommand((optt)=>optt
        .setName("troll")
        .setDescription("FAQ: How to report trolls")
    )
    .addSubcommand((optt)=>optt
        .setName("appeal")
        .setDescription("FAQ: How to appeal a ban on a server")
    )
    .addSubcommand((optt)=>optt
        .setName("trusted")
        .setDescription("FAQ: Using TF equipment")
    )
    .addSubcommand((optt)=>optt
        .setName("todo")
        .setDescription("FAQ: What to do on the servers")
    )
    .addSubcommand((optt)=>optt
        .setName("filters")
        .setDescription("FAQ: What filters to use")
    )
};
