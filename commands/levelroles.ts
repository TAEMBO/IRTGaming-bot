import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client';
import fs from 'node:fs';
import canvas from 'canvas';
export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		const subCmd = interaction.options.getSubcommand();
		const allData = await client.userLevels._content.find({});

		if (subCmd === "leaderboard") {
			const messageCountsTotal = allData.reduce((a, b) => a + b.messages, 0);

			const data = JSON.parse(fs.readFileSync('./databases/dailyMsgs.json', 'utf8')).map((x: Array<number>, i: number, a: any) => {
				const yesterday = a[i - 1] || [];
				return x[1] - (yesterday[1] || x[1]);
			}).slice(1).slice(-60);
			
			// handle negative days
			data.forEach((change: number, i: number) => {
				if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
			});
			
			const maxValue = Math.max(...data);
			const maxValueArr = maxValue.toString().split('');
			
			const first_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 1)) * 10 ** (maxValueArr.length - 1);
			// console.log({ first_graph_top });
			
			const second_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 2)) * 10 ** (maxValueArr.length - 2);
			// console.log({ second_graph_top });
			
			const textSize = 40;
			
			const img = canvas.createCanvas(1500, 750);
			const ctx = img.getContext('2d');
			
			const graphOrigin = [15, 65];
			const graphSize = [1300, 630];
			const nodeWidth = graphSize[0] / (data.length - 1);
			ctx.fillStyle = '#36393f';
			ctx.fillRect(0, 0, img.width, img.height);
			
			// grey horizontal lines
			ctx.lineWidth = 5;
			
			let interval_candidates = [];
			for (let i = 4; i < 10; i++) {
				const interval = first_graph_top / i;
				if (Number.isInteger(interval)) {
					let intervalString = interval.toString();
					const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
					interval_candidates.push([interval, i, reference_number]);
				}
			}
			// console.log({ interval_candidates });
			const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
			// console.log({ chosen_interval });
			
			let previousY: Array<number> = [];
			
			ctx.strokeStyle = '#202225';
			for (let i = 0; i <= chosen_interval[1]; i++) {
				const y = graphOrigin[1] + graphSize[1] - (i * (chosen_interval[0] / second_graph_top) * graphSize[1]);
				if (y < graphOrigin[1]) continue;
				const even = ((i + 1) % 2) === 0;
				if (even) ctx.strokeStyle = '#2c2f33';
				ctx.beginPath();
				ctx.lineTo(graphOrigin[0], y);
				ctx.lineTo(graphOrigin[0] + graphSize[0], y);
				ctx.stroke();
				ctx.closePath();
				if (even) ctx.strokeStyle = '#202225';
				previousY = [y, i * chosen_interval[0]];
			}
			
			// 30d mark
			ctx.setLineDash([8, 16]);
			ctx.beginPath();
			const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 30));
			ctx.lineTo(lastMonthStart, graphOrigin[1]);
			ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
			ctx.stroke();
			ctx.closePath();
			ctx.setLineDash([]);
			
			// draw points
			ctx.strokeStyle = client.config.embedColor as string;
			ctx.fillStyle = client.config.embedColor as string;
			ctx.lineWidth = 5;
			
			
			const getYCoordinate = (value: number) => ((1 - (value / second_graph_top)) * graphSize[1]) + graphOrigin[1];
			
			let lastCoords: Array<number> = [];
			data.forEach((val: number, i: number) => {
				ctx.beginPath();
				if (lastCoords) ctx.moveTo(lastCoords[0], lastCoords[1]);
				if (val < 0) val = 0;
				const x = i * nodeWidth + graphOrigin[0];
				const y = getYCoordinate(val);
				ctx.lineTo(x, y);
				lastCoords = [x, y];
				ctx.stroke();
				ctx.closePath();

				// ball
				ctx.beginPath();
				ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI)
				ctx.closePath();
				ctx.fill();
			});
			
			// draw text
			ctx.font = '400 ' + textSize + 'px sans-serif';
			ctx.fillStyle = 'white';
			
			// highest value
			const maxx = graphOrigin[0] + graphSize[0] + textSize;
			const maxy = previousY[0] + (textSize / 3);
			ctx.fillText(previousY[1].toLocaleString('en-US'), maxx, maxy);
			
			// lowest value
			const lowx = graphOrigin[0] + graphSize[0] + textSize;
			const lowy = graphOrigin[1] + graphSize[1] + (textSize / 3);
			ctx.fillText('0 msgs', lowx, lowy);
			
			// 30d
			ctx.fillText('30d ago', lastMonthStart, graphOrigin[1] - (textSize / 3));
			
			// time ->
			const tx = graphOrigin[0] + (textSize / 2);
			const ty = graphOrigin[1] + graphSize[1] + (textSize);
			ctx.fillText('time ->', tx, ty);

			const topUsers = allData.sort((a, b) => b.messages - a.messages).slice(0, 10).map((x, i) => `\`${i + 1}.\` <@${x._id}>: ${x.messages.toLocaleString('en-US')}`).join('\n');
			
			interaction.reply({
				files: [new client.attachmentBuilder(img.toBuffer(), {name: "dailymsgs.png"})],
				embeds: [new client.embed()
					.setTitle('Ranking leaderboard')
					.setDescription(`A total of **${messageCountsTotal.toLocaleString('en-US')}** messages have been recorded in this server.`)
					.addFields({name: 'Top users by messages sent:', value: topUsers})
					.setImage('attachment://dailymsgs.png')
					.setColor(client.config.embedColor)]
			});
		} else if (subCmd === "view") {

			// fetch user or user interaction sender
			const member = interaction.options.getMember("member") ?? interaction.member;

			// information about users progress on level roles
			const userData = await client.userLevels._content.findById(member.user.id);
		
			const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themself
				if (interaction.user.id === member.user.id) return you || true;
				else return they || false;
			};

			if (!userData) return interaction.reply(`${pronounBool('You', 'They')} currently don't have a level, send some messages to level up.`);
		
			const index = allData.sort((a, b) => b.messages - a.messages).map(x => x._id).indexOf(member.id) + 1;
			const memberDifference = userData.messages - client.userLevels.algorithm(userData.level);
			const levelDifference = client.userLevels.algorithm(userData.level+1) - client.userLevels.algorithm(userData.level);

			interaction.reply({embeds: [new client.embed()
				.setTitle([
					`Level: **${userData.level}**`,
					`Rank: **${index ? '#' + index  : 'last'}**`,
					`Progress: **${memberDifference}/${levelDifference} (${(memberDifference/levelDifference*100).toFixed(2)}%)**`,
					`Total: **${userData.messages}**`
				].join('\n'))
				.setColor(member.displayColor)
				.setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048}))
				.setAuthor({name: `Ranking for ${member.user.tag}`})
			]});
	 	} else if (subCmd == 'info') {
			interaction.reply({embeds: [new client.embed()
				.setColor(client.config.embedColor)
				.setDescription([
					'**Q** How do I progress?\n**A** This system is message-based, meaning each message you send progresses you.',
					'**Q** What is going to happen to the <@757962216535359586> (MEE6) level system?\n**A** It will be replaced with this one.',
					'**Q** Can I transfer my progress from the MEE6 level system to this one?\n**A** Yes, message <@615761944154210305> (TÆMBØ#5512) with your request.',
					'**Q** Why is this change being done?\n**A** This bot is free for IRTGaming, MEE6 is not free for IRTGaming. I\'m sure you can figure out the rest.'
				].join('\n\n'))
			]});
		}
	},
	data: new SlashCommandBuilder()
	.setName("rank")
	.setDescription("Ranking system")
	.addSubcommand((optt)=>optt
		.setName("view")
		.setDescription("View your or another member's ranking information")
		.addUserOption((opt)=>opt
			.setName("member")
			.setDescription("Member whose rank to view")
			.setRequired(false))
	)
	.addSubcommand((optt)=>optt
		.setName("leaderboard")
		.setDescription("View top 10 users")
	)
	.addSubcommand((optt)=>optt
		.setName('info')
		.setDescription('Information on how ranking works')
	)
};
