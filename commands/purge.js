const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {
		if (!client.hasModPerms(interaction.member)) return client.youNeedRole(interaction, "mod");
		const amount = interaction.options.getInteger("amount");
		if (amount > 100) return interaction.reply({content: 'Discord\'s API limits purging up to 100 messages.', ephemeral: true});
		const user = interaction.options.getUser("user");

        let messagesArray = [];

		if(user){
			interaction.channel.messages.fetch({limit: 100}).then((msgs)=>{
				const cum = msgs.filter(x => x.author.id === user.id);
				interaction.channel.bulkDelete(cum);
			})
		}else{
			await interaction.channel.messages.fetch({ limit: amount }).then(async messages => {
				messages.forEach(message => {
					messagesArray.push(message.id);
				});
				await interaction.channel.bulkDelete(messagesArray);
			});
		}

			await interaction.reply({content: `Successfully deleted ${amount} messages.`, ephemeral: true});

	},
	data: new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Purges messages in a channel.")
		.addIntegerOption((opt)=>opt
			.setName("amount")
			.setDescription("The amount of messages to purge.")
			.setRequired(true))
		.addUserOption((opt)=>opt
			.setName("user")
			.setDescription("The user to purge messages from.")
			.setRequired(false))
};
