import Discord, { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder} from 'discord.js';
import YClient from '../client';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            staff: () => interaction.reply({components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`https://canary.discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))]}),
            troll: () => interaction.reply({embeds: [new client.embed()
                .setTitle('Reporting trolls: Brief')
                .setColor(client.config.embedColor)
                .setDescription(`Go to <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> and type:\n\n<@&${client.config.mainServer.roles.mpstaff}> **[**troll's name**] [**what they're doing**] [**picture or video if possible**]**`),
                new client.embed()
                .setTitle('Reporting trolls: Detailed')
                .setDescription(`While playing on the public servers, you may come across the odd player misbehaving and messing things up. If you do, please report them in <#${client.config.mainServer.channels.fs22_silage}> or <#${client.config.mainServer.channels.fs22_grain}> along with a short description of what they're doing and tag <@&${client.config.mainServer.roles.mpstaff}>.`)
                .addFields({name: 'Notes', value: `> When reporting a player, please include a name or screenshot/video including the name of the player. Staff can't help if they don't know who to look out for.\n\n> Please do not tag individual staff members unless they are already on the server. Otherwise, it'll take longer for an available staff member to notice it.\n\n> Please do not DM staff members to report players unless otherwise allowed to.`})
                .setImage('https://media.discordapp.net/attachments/979863373439184966/996178337984675961/unknown.png')
                .setColor(client.config.embedColor)
            ]}),
            appeal: () => interaction.reply({components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(5).setURL(`https://discord.com/channels/552565546089054218/825046442300145744/969893324947337246`).setLabel("Appeal an MP ban"))]}),
            filters: () => interaction.reply({embeds: [new client.embed().setColor(client.config.embedColor).setTitle('Please note that our servers may "ghost" and not show up until you\'ve refreshed your MP menu some times.').setImage('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')]}),
            todo: () => interaction.reply({embeds: [new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .addFields(
                    {name: 'Public Silage', value: `> For <#${client.config.mainServer.channels.fs22_silage}>, things you can do on the server are: \n- Harvest corn\n- Replant fields\n- Cut grass in any area that has grown grass\n- Pick up cut grass\n- Run silage from the bunkers to be sold at the Animal Dealer, north of field 7\n- Tidy up the yard`},
                    {name: 'Public Grain', value: `> For <#${client.config.mainServer.channels.fs22_grain}>, things you can do on the server are: \n- Harvest crops on fields\n- Bale straw to be later picked up and sold at Animal Dealer\n- Run grain trailers from the fields being harvested to sellpoints like Straig Lager or Supermarket\n- Tidy up the yard`})
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
