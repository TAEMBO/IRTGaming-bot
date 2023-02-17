import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import fs from 'node:fs';
import ms from 'ms';
import { Reminder } from '../interfaces';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const reminderText = interaction.options.getString("what", true);
        const reminderTime = ms(interaction.options.getString("when", true)) as number | undefined;
        
        if (reminderTime) {
            const timeStampInMs = Math.round((Date.now() + reminderTime) / 1000);
            const remindersDb: Array<Reminder> = JSON.parse(fs.readFileSync('./databases/reminders.json', 'utf8'));
            const reminderObj = { when: timeStampInMs, what: reminderText, who: interaction.user.id };

            remindersDb.push(reminderObj);
            fs.writeFileSync('./databases/reminders.json', JSON.stringify(remindersDb, null, 2));

            console.log(client.timeLog('\x1b[33m'), 'REMINDER CREATE', reminderObj);
            interaction.reply({embeds: [new client.embed()
                .setTitle('Reminder set')
                .setDescription(`\n\`\`\`${reminderText}\`\`\`\n<t:${timeStampInMs}:R>.`)
                .setColor(client.config.embedColor)
            ]});
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