const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');

module.exports = { 
    run: async (client, interaction) => {
        const options = interaction.options.getString('questions');

        if (options === 'staff') {
            interaction.reply({components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle("Link").setURL(`https://canary.discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))]})
        } else if (options === 'troll') {
            const embed1 = new client.embed()
                .setTitle('Reporting trolls: Brief')
                .setColor(client.config.embedColor)
                .setDescription(`Go to <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> and type:\n\n<@&${client.config.mainServer.roles.mpstaff}> **[**troll's name**] [**what they're doing**] [**picture or video if possible**]**`)
            const embed2 = new client.embed()
                .setTitle('Reporting trolls: Detailed')
                .setDescription(`While playing on the public servers, you may come across the odd player misbehaving and messing things up. If you do, please report them in <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> along with a short description of what they're doing and tag <@&${client.config.mainServer.roles.mpstaff}>.`)
                .addFields(
                    {name: 'Notes', value: `> When reporting a player, please include a name or screenshot/video including the name of the player. Staff can't help if they don't know who to look out for.\n\n> Please do not tag individual staff members unless they are already on the server. Otherwise, it'll take longer for an available staff member to notice it.\n\n> Please do not DM staff members to report players unless otherwise allowed to.`})
                .setImage('https://media.discordapp.net/attachments/979863373439184966/996178337984675961/unknown.png')
                .setColor(client.config.embedColor)
            interaction.reply({embeds: [embed1, embed2]})
        } else if (options === 'appeal') {
            interaction.reply({embeds: [new client.embed().setDescription('To appeal a ban on a server, go to <#825046442300145744> to create a ticket. Within the ticket, type `!appeal`.').setColor(client.config.embedColor)]})
        } else if (options === 'blue') {
            interaction.reply('To access the blue farm on Public Grain to use seeders, [see here](https://discord.com/channels/552565546089054218/729823615096324166/980241004718329856) and look for a line marked "**Blue farm password**".')
        } else if (options === 'filters') {
            interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Please note that our servers may "ghost" and not show up until you\'ve refreshed your MP menu some times.').setImage('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')]})
        } else if (options === 'todo') {
            const embed = new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .addFields(
                    {name: 'Public Silage', value: `> For <#${client.config.mainServer.channels.fs22_silage}>, things you can do on the server are: \n- Harvest corn\n- Replant fields with *corn*\n- Cut grass in any area that has grown grass\n- Pick up cut grass\n- Run silage from the bunkers to the Animal Dealer north of field 7\n- Tidy up the yard`},
                    {name: 'Public Grain', value: `> For <#${client.config.mainServer.channels.fs22_grain}>, things you can do on the server are: \n- Harvest crops on fields\n- Replant fields with any crop __other than *oilseed radish* and *grass*__**(**on blue farm only**)**\n- Run grain trailers from the fields being harvested to sellpoints like Straig Lager or Supermarket\n- Tidy up the yard`}
                )
            .setFooter({text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing'})
            interaction.reply({embeds: [embed]})
        } else if (options === 'equipment') {
            interaction.reply('Buying more equipment on our servers will sometimes have a negative impact. Every piece of equipment takes up a certain amount of slots. We need to maintain an acceptable amount of slots in order to keep our server accessible to console players. More vehicles and implements also contribute to the file sizes of the servers causing more server lag.')
        }
    },
    data: new SlashCommandBuilder()
    .setName("faq")
    .setDescription("Frequently asked questions")
    .addStringOption((opt)=>opt
      .setName('questions')
      .setDescription('FAQ')
      .addChoices(
        {name: 'Applying for MP Staff', value: 'staff'},
        {name: 'Reporting trolls', value: 'troll'},
        {name: 'MP ban appeal', value: 'appeal'},
        {name: 'Blue farm on PG', value: 'blue'},
        {name: 'To do on MP servers', value: 'blue'},
        {name: 'MP filters to join', value: 'filters'},
        {name: 'Buying equipment', value: 'equipment'})
      .setRequired(true))
};
