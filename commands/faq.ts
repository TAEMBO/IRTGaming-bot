import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { TInteraction } from '../typings.js';
import { FSServers } from '../utilities.js';

export default {
	async run(interaction: TInteraction) {
        ({
            staff: () => interaction.reply({ components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/552565546089054218/852483521859551232/866257346513862687`).setLabel("Apply for MP Staff"))
            ] }),
            troll: () => interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle('Reporting trolls')
                .setColor(interaction.client.config.embedColor)
                .setImage('https://cdn.discordapp.com/attachments/979863373439184966/1123088776185516032/image.png')
                .setDescription([
                    `If a player is causing problems on a server, don't hesitate to send a report to ${new FSServers(interaction.client.config.fs).getPublicAll().map(([_, x]) => `<#${x.channelId}>`).join(' or ')} with:`,
                    '',
                    [
                        '- The name of the player',
                        '- What they are doing',
                        '- A picture or video as proof if possible',
                        `- The <@&${interaction.client.config.mainServer.roles.mpstaff}> tag to notify staff`
                    ].join('\n'),
                    '',
                    `Please do not ping or DM individual staff members, use the <@&${interaction.client.config.mainServer.roles.mpstaff}> tag as mentioned above.`,
                    `Check ⁠<#${interaction.client.config.mainServer.channels.mpRulesAndInfo}> to see what a good reason could be for a player report.`
                ].join('\n'))
            ] }),
            appeal: () => interaction.reply([
                "If you would like to appeal your ban on our MP servers",
                "head to <#825046442300145744> and open an [MP Support](https://discord.com/channels/552565546089054218/825046442300145744/969893324947337246) ticket to privately discuss it with MP Staff."
            ].join(', ')),
            todo: () => interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle('To-do')
                .setColor(interaction.client.config.embedColor)
                .setFooter({ text: 'Note that not every task listed might be available to do at the time, so do your due dilligence to see what needs doing in the moment.' })
                .setFields(...new FSServers(interaction.client.config.fs).getPublicAll().map(([_, x]) => ({ name: x.fullName, value: '- ' + x.todo.join('\n- ') })))
            ] }),
            filters: () => interaction.reply({ embeds: [new EmbedBuilder()
                .setColor(interaction.client.config.embedColor)
                .setTitle('Please note that servers may "ghost" and not show up until you\'ve refreshed your MP menu several times.')
                .setImage('https://cdn.discordapp.com/attachments/830916009107652630/978795707681079376/unknown.png')
            ] }),
            equipment: () => interaction.reply([
                'Purchasing new equipment can cause large impacts, including:',
                '- Increased slot amounts',
                '- Increased file sizes, causing larger amounts of lag',
                'Therefore, we try to refrain from purchasing any new equipment.'
            ].join('\n')),
            passwords: () => interaction.reply([
                'We run multiple farms for each of our public servers to aid managing them',
                'Players who join our servers will only ever need to join the green farm, labeled with our Discord invite link, which should never have a password set on it',
                'All other farms contain "Staff" in their name, indicating that no one except staff should ever need to access them',
                '',
                'If one of our public servers are locked, the password to them can be found in their respective channel\'s pinned messages. Note that we may not use that password at all times.'
            ].join('. ')),
            terrain: () => interaction.reply([
                'When you join one of our servers, you may encounter terrain with jagged edges or extreme deformations into the ground',
                'This however is not the actual terrain formation on the server, and thus has no affect on where you can drive around',
                'These are simply visual glitches that are only seen on your end, so don\'t fret that the server was possibly griefed!'
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
                { name: 'Appeal an MP ban', value: 'appeal' },
                { name: 'What to do on MP servers', value: 'todo' },
                { name: 'MP filters to join', value: 'filters' },
                { name: 'Buying equipment', value: 'equipment' },
                { name: 'Getting passwords', value: 'passwords' },
                { name: 'Terrain glitches', value: 'terrain' })
            .setRequired(true))
};
