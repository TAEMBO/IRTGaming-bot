import Discord, { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder} from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            staff: () => interaction.reply({components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`https://canary.discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))]}),
            troll: () => interaction.reply({embeds: [new client.embed()
                .setTitle('Reporting trolls')
                .setColor(client.config.embedColor)
                .setImage('https://media.discordapp.net/attachments/979863373439184966/996178337984675961/unknown.png')
                .setDescription(`While playing on our public servers, you may come across a player causing issues. If you do, please send a report to <#${client.config.mainServer.channels.mpPublicSilage}> or <#${client.config.mainServer.channels.mpPublicGrain}> with the __name of the player__, __what they're doing__, and __a picture or video as evidence if possible__.\nIt's important to note that we ask that people to __not ping or DM individual staff members__ **(**unless otherwise allowed to**)**, __ping <@&${client.config.mainServer.roles.mpstaff}> in your report__ so it can be swiftly dealt with.`)
            ]}),
            appeal: () => interaction.reply({components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`https://discord.com/channels/552565546089054218/825046442300145744/969893324947337246`).setLabel("Appeal an MP ban"))]}),
            filters: () => interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Please note that our servers may "ghost" and not show up until you\'ve refreshed your MP menu some times.').setImage('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')]}),
            todo: () => interaction.reply({embeds: [new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .addFields(
                    {name: 'Public Silage', value: `> For <#${client.config.mainServer.channels.mpPublicSilage}>, things you can do on the server are: \n- Harvest corn\n- Replant fields\n- Cut grass in any area that has grown grass\n- Pick up cut grass\n- Run silage from the bunkers to be sold at the Animal Dealer, north of field 7\n- Tidy up the yard`},
                    {name: 'Public Grain', value: `> For <#${client.config.mainServer.channels.mpPublicGrain}>, things you can do on the server are: \n- Harvest crops on fields\n- Bale straw to be later picked up and sold at Animal Dealer\n- Run grain trailers from the fields being harvested to sellpoints like Straig Lager or Supermarket\n- Tidy up the yard`})
                .setFooter({text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing'})
            ]}),
            equipment: () => interaction.reply('Buying more equipment on our servers will sometimes have a negative impact. Every piece of equipment takes up a certain amount of slots. We need to maintain an acceptable amount of slots in order to keep our server accessible to console players. More vehicles and implements also contribute to the file sizes of the servers causing more server lag.')
        } as any)[interaction.options.getString('questions', true)]();
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
        {name: 'To do on MP servers', value: 'todo'},
        {name: 'MP filters to join', value: 'filters'},
        {name: 'Buying equipment', value: 'equipment'})
      .setRequired(true))
};
