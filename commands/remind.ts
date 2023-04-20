import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import ms from 'ms';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const reminderText = interaction.options.getString("what", true);
        const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
        
        if (reminderTime) {
            interaction.reply({embeds: [new client.embed()
                .setTitle('Reminder set')
                .setDescription(`\n\`\`\`${reminderText}\`\`\`\n<t:${Math.round((Date.now() + reminderTime) / 1000)}:R>.`)
                .setColor(client.config.embedColor)
            ], fetchReply: true}).then(async msg => {
                const reminder = await client.reminders._content.create({ userid: interaction.user.id, content: reminderText, time: Date.now() + reminderTime, ch: msg.channelId, msg: msg.id });
                client.log('\x1b[33m', 'REMINDER CREATE', reminder);
            });
        } else interaction.reply({embeds: [new client.embed()
            .setTitle('Incorrect timestamp.')
            .addFields({name: 'Proper formatting', value: '```Seconds: 10s, 1sec, 10secs, 1second, 10seconds\nMinutes: 10m, 1min, 10mins, 1minute, 10minutes\nHours: 10h, 1hour, 10hours\nDays: 10d, 1day, 10days```'})
            .setColor(client.config.embedColorRed)
        ], ephemeral: true});
      },
      data: new SlashCommandBuilder()
        .setName("remind")
        .setDescription("Set a reminder for something")
        .addStringOption(opt => opt
            .setName("what")
            .setDescription("The reminder itself")
            .setRequired(true))
        .addStringOption(opt => opt
            .setName("when")
            .setDescription("When to remind, do \"help\" to see format")
            .setRequired(true))
};