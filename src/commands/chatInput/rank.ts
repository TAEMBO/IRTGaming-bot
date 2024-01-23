import { SlashCommandBuilder, AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import canvas from 'canvas';

export default {
	async run(interaction: ChatInputCommandInteraction<"cached">) {
		const subCmd = interaction.options.getSubcommand();
		const allData = await interaction.client.userLevels.data.find();

		if (subCmd === "leaderboard") {
			const messageCountsTotal = allData.reduce((a, b) => a + b.messages, 0);
			const data = interaction.client.dailyMsgs.data.map((x, i, a) => {
				const yesterday = a[i - 1] || [];

				return x[1] - (yesterday[1] || x[1]);
			}).slice(1).slice(-60);
			
            // handle negative days
            for (const [i, change] of data.entries()) if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;
			
			const maxValue = Math.max(...data);
			const maxValueArr = maxValue.toString().split('');
			const first_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 1)) * 10 ** (maxValueArr.length - 1);
			const second_graph_top = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 2)) * 10 ** (maxValueArr.length - 2);
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
			
			const interval_candidates: [number, number, number][] = [];
			for (let i = 4; i < 10; i++) {
				const interval = first_graph_top / i;

				if (Number.isInteger(interval)) {
					let intervalString = interval.toString();
					const reference_number = i * Math.max(intervalString.split('').filter(x => x === '0').length / intervalString.length, 0.3) * (['1', '2', '4', '5', '6', '8'].includes(intervalString[0]) ? 1.5 : 0.67)
					interval_candidates.push([interval, i, reference_number]);
				}
			}
			const chosen_interval = interval_candidates.sort((a, b) => b[2] - a[2])[0];
			let previousY: number[] = [];

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
            const lastMonthStart = graphOrigin[0] + (nodeWidth * (data.length - 30));

			ctx.setLineDash([8, 16]);
			ctx.beginPath();
			ctx.lineTo(lastMonthStart, graphOrigin[1]);
			ctx.lineTo(lastMonthStart, graphOrigin[1] + graphSize[1]);
			ctx.stroke();
			ctx.closePath();
			ctx.setLineDash([]);
			
			// draw points
			ctx.strokeStyle = interaction.client.config.EMBED_COLOR;
			ctx.fillStyle = interaction.client.config.EMBED_COLOR;
			ctx.lineWidth = 5;
			
			let lastCoords: number[] = [];

            for (let [i, val] of data.entries()) {
                ctx.beginPath();

				if (lastCoords) ctx.moveTo(lastCoords[0], lastCoords[1]);
				if (val < 0) val = 0;

				const x = i * nodeWidth + graphOrigin[0];
				const y = ((1 - (val / second_graph_top)) * graphSize[1]) + graphOrigin[1];

				ctx.lineTo(x, y);

				lastCoords = [x, y];

				ctx.stroke();
				ctx.closePath();

				// ball
				ctx.beginPath();
				ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI)
				ctx.closePath();
				ctx.fill();
            }
			
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
			const ty = graphOrigin[1] + graphSize[1] + textSize;

			ctx.fillText('time ->', tx, ty);

			const topUsers = allData.sort((a, b) => b.messages - a.messages).filter(x => !x.hasLeft).slice(0, 10).map((x, i) => `\`${i + 1}.\` <@${x._id}>: ${x.messages.toLocaleString('en-US')}`).join('\n');
			
			await interaction.reply({
				files: [new AttachmentBuilder(img.toBuffer(), { name: "dailymsgs.png" })],
				embeds: [new EmbedBuilder()
					.setTitle('Ranking leaderboard')
					.setDescription(`A total of **${messageCountsTotal.toLocaleString('en-US')}** messages have been recorded in this server.`)
					.addFields({ name: 'Top users by messages sent:', value: topUsers })
					.setImage('attachment://dailymsgs.png')
					.setColor(interaction.client.config.EMBED_COLOR)]
			});
		} else if (subCmd === "view") {
			// fetch user or user interaction sender
			const member = interaction.options.getMember("member") ?? interaction.member;

			// information about users progress on level roles
			const userData = await interaction.client.userLevels.data.findById(member.user.id);
		
			const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themself
				if (interaction.user.id === member.user.id) return you || true;
				else return they || false;
			};

			if (!userData) return await interaction.reply(`${pronounBool('You', 'They')} currently don't have a level, send some messages to level up.`);
		
			const index = allData.sort((a, b) => b.messages - a.messages).map(x => x._id).indexOf(member.id) + 1;
			const memberDifference = userData.messages - interaction.client.userLevels.algorithm(userData.level);
			const levelDifference = interaction.client.userLevels.algorithm(userData.level + 1) - interaction.client.userLevels.algorithm(userData.level);

			await interaction.reply({ embeds: [new EmbedBuilder()
				.setTitle([
					`Level: **${userData.level}**`,
					`Rank: **${index ? '#' + index  : 'last'}**`,
					`Progress: **${memberDifference.toLocaleString("en-US")}/${levelDifference.toLocaleString("en-US")} (${(memberDifference / levelDifference * 100).toFixed(2)}%)**`,
					`Total: **${userData.messages.toLocaleString("en-US")}**`
				].join('\n'))
				.setColor(member.displayColor)
				.setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 2048 }))
				.setAuthor({ name: `Ranking for ${member.user.tag}` })
			] });
		}
	},
	data: new SlashCommandBuilder()
	    .setName("rank")
	    .setDescription("Ranking system")
	    .addSubcommand(x => x
	    	.setName("view")
	    	.setDescription("View your or another member's ranking information")
	    	.addUserOption(x => x
	    		.setName("member")
	    		.setDescription("Member whose rank to view")
	    		.setRequired(false)))
	    .addSubcommand(x => x
	    	.setName("leaderboard")
	    	.setDescription("View top 10 users"))
};
