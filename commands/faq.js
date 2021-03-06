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
                .setImage('https://media.discordapp.net/attachments/979863373439184966/996178337984675961/unknown.png')
                .setColor(client.config.embedColor)]})
        } else if (subCmd === 'appeal') {
            interaction.reply({embeds: [new client.embed().setDescription('To appeal a ban on a server, go to <#825046442300145744> to create a ticket. Within the ticket, type `!appeal`.').setColor(client.config.embedColor)]})
        } else if (subCmd === 'blue') {
            interaction.reply('To access the blue farm on Public Grain to use seeders, [see here](https://discord.com/channels/552565546089054218/729823615096324166/980241004718329856) and look for a line marked "**Blue farm password**".')
        } else if (subCmd === 'filters') {
            interaction.reply('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')
        } else if (subCmd === 'todo') {
            const embed = new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .addFields(
                    {name: 'Public Silage', value: `> For <#${client.config.mainServer.channels.fs22_silage}>, things you can do on the server are: \n- Harvest corn\n- Replant fields with *corn*\n- Cut grass in any area that has grown grass\n- Pick up cut grass\n- Run silage from the bunkers to the Animal Dealer north of field 7\n- Tidy up the yard`},
                    {name: 'Public Grain', value: `> For <#${client.config.mainServer.channels.fs22_grain}>, things you can do on the server are: \n- Harvest crops on fields\n- Replant fields with any crop __other than *oilseed radish* and *grass*__**(**on blue farm only**)**\n- Run grain trailers from the fields being harvested to sellpoints like Straig Lager or Supermarket\n- Tidy up the yard`}
                )
            .setFooter({text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing'})
            interaction.reply({embeds: [embed]})
        } else if (subCmd === 'equipment') {
            interaction.reply('Buying more equipment on our servers will sometimes have a negative impact. Every piece of equipment takes up a certain amount of slots. We need to maintain an acceptable amount of slots in order to keep our server accessible to console players. More vehicles and implements also contribute to the file sizes of the servers causing more server lag.')
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
        .setName("blue")
        .setDescription("FAQ: Blue farm on PG")
    )
    .addSubcommand((optt)=>optt
        .setName("todo")
        .setDescription("FAQ: What to do on the servers")
    )
    .addSubcommand((optt)=>optt
        .setName("filters")
        .setDescription("FAQ: What filters to use")
    )
    .addSubcommand((optt)=>optt
        .setName("equipment")
        .setDescription("FAQ: Buying equipment")
)
};
