import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import path from 'node:path';
import fs from 'node:fs';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
        const ms = require('ms');
        const whatToRemind = interaction.options.getString("what", true);
        const whenToRemind = ms(interaction.options.getString("when", true));
        if (whenToRemind == null) {
            const incorrectTimeFormatEmbed = new client.embed()
                .setTitle('Incorrect timestamp.')
                .addFields({name: 'Proper formatting', value: '```Seconds: 10s, 1sec, 10secs, 1second, 10seconds\nMinutes: 10m, 1min, 10mins, 1minute, 10minutes\nHours: 10h, 1hour, 10hours\nDays: 10d, 1day, 10days```'})
                .setColor(client.config.embedColorRed);
            return await interaction.reply({embeds: [incorrectTimeFormatEmbed], ephemeral: true});
        };
        const timeStampInMs = Math.round((Date.now() + whenToRemind) / 1000);
        const dbPath = path.join(__dirname, '../databases/reminders.json');
        const db = require(dbPath);
        const reminder = {when: timeStampInMs, what: whatToRemind, who: interaction.user.id};
        const remindEmbed = new client.embed()
            .setTitle('Reminder set')
            .setDescription(`\n\`\`\`${whatToRemind}\`\`\`\n<t:${timeStampInMs}:R>.`)
            .setColor(client.config.embedColor)
        db.push(reminder);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log('REMINDER CREATE', reminder)
        interaction.reply({embeds: [remindEmbed]});
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