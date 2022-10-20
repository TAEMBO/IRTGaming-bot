const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');

module.exports = {
	run: async (client, interaction) => {

		// messages sent by each user, unordered array
		const messageCounts = Object.values(client.userLevels._content);

		// total amount of messages sent
		const messageCountsTotal = messageCounts.reduce((a, b) => a + b, 0);
		const subCmd = interaction.options.getSubcommand();
		if (subCmd === "stats") {
			const embed = new client.embed()
				.setTitle('Level Roles: Stats')
				.setDescription(`Since the beginning of the month, a total of **${messageCountsTotal.toLocaleString('en-US')}** messages have been recorded in this server.`)
				.addFields({name: 'Top users by messages sent:', value: Object.entries(client.userLevels._content).sort((a, b) => b[1] - a[1]).slice(0, 10).map((x, i) => `\`${i + 1}.\` <@${x[0]}>: ${x[1].toLocaleString('en-US')}`).join('\n')})
				.setColor(client.config.embedColor)
			interaction.reply({embeds: [embed]});
			return;
		} else if(subCmd === "view"){

		const embed0 = new client.embed()
	    	.setColor(client.config.embedColor)

		// fetch user or user interaction sender
		const member = interaction.options.getMember("member") ?? interaction.member;

		// information about users progress on level roles
		const eligiblity = await client.userLevels.getEligible(member);
		
		const pronounBool = (you, they) => { // takes 2 words and chooses which to use based on if user did this command on themself
			if (interaction.user.id === member.user.id) return you || true;
			else return they || false;
		};
		
		let ranking;

		if (pronounBool()) {
			const index = Object.entries(client.userLevels._content).sort((a, b) => b[1] - a[1]).map(x => x[0]).indexOf(interaction.user.id) + 1;
			const suffix = ((index) => {
				const numbers = index.toString().split('').reverse(); // eg. 1850 -> [0, 5, 8, 1]
				if (numbers[1] === '1') { // this is some -teen
					return 'th';
				} else {
					if (numbers[0] === '1') return 'st';
					else if (numbers[0] === '2') return 'nd';
					else if (numbers[0] === '3') return 'rd';
					else return 'th';
				}
			})(index);
			
			ranking = `\n> You're ${index ? index + suffix : 'last'} in a descending list of all users, ordered by their Level Roles message count.`;
		}
	
		embed0.setDescription(`**${eligiblity.messages.toLocaleString('en-US')}** messages\n**${Math.floor(eligiblity.age).toLocaleString('en-US')}d** time on server`)
		interaction.reply({content: `**${eligiblity.messages.toLocaleString('en-US')}** messages\n**${Math.floor(eligiblity.age).toLocaleString('en-US')}d** time on server${ranking ? ranking : ''}`}); // compile message and send
	 } else if (subCmd === 'reset') {
		if (!client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('You\'re not allowed to use this command.');

		const msg = await interaction.reply({content: 'Are you sure you want to reset all LRS data?', fetchReply: true, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`Yes`).setStyle("Success").setLabel("Confirm"), new ButtonBuilder().setCustomId(`No`).setStyle("Danger").setLabel("Cancel"))]});
		const filter = (i) => ["Yes", "No"].includes(i.customId) && i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 30000});
		collector.on("collect", async (int) => {
			if(int.customId === "Yes"){
				const fs = require('fs');
				const path = require('path');
				fs.writeFileSync(path.resolve('./databases/userLevels.json'), '{}');
				client.userLevels._content = require('../databases/userLevels.json');
				int.update({content: ':white_check_mark: LRS data reset.', components: []})
			} else if(int.customId === "No"){
				int.update({content: ':x: Command canceled.', components: []});
			}
		});
	 }
	},
	data: new SlashCommandBuilder()
	.setName("rank")
	.setDescription("Ranking system")
	.addSubcommand((optt)=>optt
		.setName("view")
		.setDescription("View your or another user's ranking information")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("Member whose rank to view")
			.setRequired(false)))
	.addSubcommand((optt)=>optt
		.setName("stats")
		.setDescription("View top 10 users."))
	.addSubcommand((optt)=>optt
		.setName("reset")
		.setDescription("Reset all LRS data."))
};
