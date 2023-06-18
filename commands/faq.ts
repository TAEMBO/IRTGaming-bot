import Discord, { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import YClient from '../client.js';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        ({
            staff: () => interaction.reply({ components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))
            ] }),
            troll: () => interaction.reply({ embeds: [new client.embed()
                .setTitle('Reporting trolls')
                .setColor(client.config.embedColor)
                .setImage('https://media.discordapp.net/attachments/979863373439184966/996178337984675961/unknown.png')
                .setDescription([
                    'While playing on our public servers, you may come across a player causing issues',
                    `If you do, please send a report to <#${client.config.mainServer.channels.mpPublicSilage}> or <#${client.config.mainServer.channels.mpPublicGrain}> with the __name of the player__, __what they're doing__, and __a picture or video as evidence if possible__`,
                    `\nIt's important to note that we ask that people to __not ping or DM individual staff members__ **(**unless otherwise allowed to**)**, __ping <@&${client.config.mainServer.roles.mpstaff}> in your report__ so it can be swiftly dealt with.`
                ].join('. '))
            ] }),
            appeal: () => interaction.reply({ components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/552565546089054218/825046442300145744/969893324947337246`).setLabel("Appeal an MP ban"))
            ] }),
            filters: () => interaction.reply({ embeds: [new client.embed()
                .setColor(client.config.embedColor)
                .setTitle('Please note that our servers may "ghost" and not show up until you\'ve refreshed your MP menu some times.')
                .setImage('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')
            ] }),
            todo: () => interaction.reply({ embeds: [new client.embed()
                .setTitle('To-do')
                .setColor(client.config.embedColor)
                .setFooter({ text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing' })
                .setFields(
                    { name: 'Public Silage', value: [
                        `> For <#${client.config.mainServer.channels.mpPublicSilage}>, things you can do on the server are: `,
                        '- Harvest corn',
                        '- Replant fields',
                        '- Cut grass in any area that has grown grass',
                        '- Pick up cut grass',
                        '- Run silage from the bunkers to be sold at the Animal Dealer at field 7',
                        '- Tidy up the yard'
                    ].join('\n') },
                    { name: 'Public Grain', value: [
                        `> For <#${client.config.mainServer.channels.mpPublicGrain}>, things you can do on the server are: `,
                        '- Harvest crops on fields',
                        '- Bale straw to be picked up and sold at sell points such as the yard or Animal Dealer',
                        '- Run grain trailers from the fields being harvested to sellpoints such as Straig Lager and Supermarket',
                        '- Tidy up the yard'
                    ].join('\n') })
            ] }),
            equipment: () => interaction.reply([
                'Buying more equipment on our servers will sometimes have a negative impact',
                'Every piece of equipment takes up a certain amount of slots',
                'We need to maintain an acceptable amount of slots in order to keep our server accessible to console players',
                'More vehicles and implements also contribute to the file sizes of the servers causing more server lag'
            ].join('. '))
        } as any)[interaction.options.getString('questions', true)]();
    },
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('Frequently asked questions')
        .addStringOption(x=>x
            .setName('questions')
            .setDescription('A list of answers to frequently asked questions')
            .addChoices(
                { name: 'Applying for MP Staff', value: 'staff' },
                { name: 'Reporting trolls', value: 'troll' },
                { name: 'MP ban appeal', value: 'appeal' },
                { name: 'To do on MP servers', value: 'todo' },
                { name: 'MP filters to join', value: 'filters' },
                { name: 'Buying equipment', value: 'equipment' })
            .setRequired(true))
};
