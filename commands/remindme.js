const {SlashCommandBuilder} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const ms = require('ms');

module.exports = {
    run: async (client, interaction) => {
        const whatToRemind = await interaction.options.getString("what");
        const whenToRemind = ms(await interaction.options.getString("when"));
        if(whenToRemind == null){
            const incorrectTimeFormatEmbed = new client.embed()
                .setTitle('Incorrect timestamp.')
                .addFields({name: 'Proper formatting', value: '```Seconds: 10s, 1sec, 10secs, 1second, 10seconds\nMinutes: 10m, 1min, 10mins, 1minute, 10minutes\nHours: 10h, 1hour, 10hours\nDays: 10d, 1day, 10days```'})
                .setColor(client.config.embedColorRed);
            await interaction.reply({embeds: [incorrectTimeFormatEmbed], ephemeral: true});
            return;
        }
        const timeStampInMs = Math.round((Date.now() + whenToRemind) / 1000);
        const dbPath = path.join(__dirname, '../databases/reminders.json');
        if(!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '[]');
        let db = require(dbPath);
        const remindEmbed = new client.embed()
            .setTitle('Reminder set.')
            .setDescription(`Reminder for\n\`\`\`${whatToRemind}\`\`\`\nset <t:${timeStampInMs}:R>.`)
            .setColor(client.config.embedColor)
        await interaction.reply({embeds: [remindEmbed]})
        db.push({when: timeStampInMs, what: whatToRemind, who: interaction.user.id});
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        db = null;
      },
      data: new SlashCommandBuilder()
        .setName("remind")
        .setDescription("remind main command")
        .addSubcommand(optt => optt
            .setName("me")
            .setDescription("me sub command")
            .addStringOption(opt => opt
                .setName("what")
                .setDescription("What should i remind you?")
                .setRequired(true))
            .addStringOption(opt => opt
                .setName("when")
                .setDescription("When i should remind you that?")
                .setRequired(true)))
};