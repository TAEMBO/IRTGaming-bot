const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = { 
	run: (client, interaction) => {
		if(!client.hasModPerms(client, interaction.member)) return client.yOuNeEdMoD(client, interaction);
        const time = interaction.options.getInteger("time");
        
        if(time > 21600) return interaction.reply('The slowmode limit is 6 hours (\`21600\` seconds).')
        interaction.channel.setRateLimitPerUser(time, `Done by ${interaction.user.tag}`)
        if(time === 0) {
            interaction.reply('Slowmode removed.')
        } else return interaction.reply(`Slowmode set to \`${time}\` ${time === 1 ? 'second' : 'seconds'}.`)
	},
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets the slowmode to the provided amount.")
        .addIntegerOption((opt)=>opt
            .setName("time")
            .setDescription("The time amount for the slowmode")
            .setRequired(true))
};