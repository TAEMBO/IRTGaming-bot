import { ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder, userMention } from "discord.js";
import canvas from "@napi-rs/canvas";
import { Command } from "#structures";

export default new Command<"chatInput">({
    async run(interaction) {
        const allData = await interaction.client.userLevels.data.find();

        if (interaction.options.getSubcommand() === "view") {
            // fetch user or user interaction sender
            const member = interaction.options.getMember("member") ?? interaction.member;

            // information about users progress on level roles
            const userData = await interaction.client.userLevels.data.findById(member.user.id);

            const pronounBool = (you: string, they: string) => { // takes 2 words and chooses which to use based on if user did this command on themself
                if (interaction.user.id === member.user.id) return you || true;
                else return they || false;
            };

            if (!userData) return await interaction.reply(`${pronounBool("You", "They")} currently don't have a level, send some messages to level up.`);

            const { algorithm } = interaction.client.userLevels;
            const index = allData.sort((a, b) => b.messages - a.messages).map((x) => x._id).indexOf(member.id) + 1;
            const memberDifference = userData.messages - interaction.client.userLevels.algorithm(userData.level);
            const levelDifference = algorithm(userData.level + 1) - algorithm(userData.level);

            return await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(
                        [
                            `Level: **${userData.level}**`,
                            `Rank: **${index ? "#" + index : "last"}**`,
                            `Progress: **${memberDifference.toLocaleString("en-US")}/${levelDifference.toLocaleString("en-US")} (${((memberDifference / levelDifference) * 100).toFixed(
                                2
                            )}%)**`,
                            `Total: **${userData.messages.toLocaleString("en-US")}**`,
                        ].join("\n")
                    )
                    .setColor(member.displayColor)
                    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 2048 }))
                    .setAuthor({ name: `Ranking for ${member.user.tag}` })
                ]
            });
        }

        const messageCountsTotal = allData.reduce((a, b) => a + b.messages, 0);
        const data = (await interaction.client.dailyMsgs.data.find())
            .map((x, i, a) => {
                const yesterday = a[i - 1] || [];

                return x.count - (yesterday.count || x.count);
            })
            .slice(1)
            .slice(-60);

        // handle negative days
        for (const [i, change] of data.entries()) if (change < 0) data[i] = data[i - 1] || data[i + 1] || 0;

        const maxValue = Math.max(...data);
        const maxValueArr = maxValue.toString().split("");
        const firstGraphTop = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 1)) * 10 ** (maxValueArr.length - 1);
        const secondGraphTop = Math.ceil(maxValue * 10 ** (-maxValueArr.length + 2)) * 10 ** (maxValueArr.length - 2);
        const textSize = 40;
        const img = canvas.createCanvas(1500, 750);
        const ctx = img.getContext("2d");
        const graphOrigin = [15, 65];
        const graphSize = [1275, 630];
        const nodeWidth = graphSize[0] / (data.length - 1);

        ctx.fillStyle = "#36393f";
        ctx.fillRect(0, 0, img.width, img.height);

        // grey horizontal lines
        ctx.lineWidth = 5;

        const intervalCandidates: [number, number, number][] = [];
        for (let i = 4; i < 10; i++) {
            const interval = firstGraphTop / i;

            if (Number.isInteger(interval)) {
                const intervalString = interval.toString();
                const referenceNumber =
                    i *
                    Math.max(intervalString.split("").filter((x) => x === "0").length / intervalString.length, 0.3) *
                    (["1", "2", "4", "5", "6", "8"].includes(intervalString[0]) ? 1.5 : 0.67);

                intervalCandidates.push([interval, i, referenceNumber]);
            }
        }
        const chosenInterval = intervalCandidates.sort((a, b) => b[2] - a[2])[0];
        let previousY: number[] = [];

        ctx.strokeStyle = "#202225";

        for (let i = 0; i <= chosenInterval[1]; i++) {
            const y = graphOrigin[1] + graphSize[1] - i * (chosenInterval[0] / secondGraphTop) * graphSize[1];

            if (y < graphOrigin[1]) continue;

            const even = (i + 1) % 2 === 0;

            if (even) ctx.strokeStyle = "#2c2f33";

            ctx.beginPath();
            ctx.lineTo(graphOrigin[0], y);
            ctx.lineTo(graphOrigin[0] + graphSize[0], y);
            ctx.stroke();
            ctx.closePath();

            if (even) ctx.strokeStyle = "#202225";

            previousY = [y, i * chosenInterval[0]];
        }

        // 30d mark
        const lastMonthStart = graphOrigin[0] + nodeWidth * (data.length - 30);

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

        for (const [i, val] of data.entries()) {
            let value = val;

            ctx.beginPath();

            if (lastCoords) ctx.moveTo(lastCoords[0], lastCoords[1]);
            if (value < 0) value = 0;

            const x = i * nodeWidth + graphOrigin[0];
            const y = (1 - value / secondGraphTop) * graphSize[1] + graphOrigin[1];

            ctx.lineTo(x, y);

            lastCoords = [x, y];

            ctx.stroke();
            ctx.closePath();

            // ball
            ctx.beginPath();
            ctx.arc(x, y, ctx.lineWidth * 1.3, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }

        // draw text
        ctx.font = "400 " + textSize + "DejaVu Sans";
        ctx.fillStyle = "white";

        // highest value
        const maxx = graphOrigin[0] + graphSize[0] + textSize;
        const maxy = previousY[0] + textSize / 3;

        ctx.fillText(previousY[1].toLocaleString("en-US"), maxx, maxy);

        // lowest value
        const lowx = graphOrigin[0] + graphSize[0] + textSize;
        const lowy = graphOrigin[1] + graphSize[1] + textSize / 3;

        ctx.fillText("0 msgs", lowx, lowy);

        // 30d
        ctx.fillText("30d ago", lastMonthStart, graphOrigin[1] - textSize / 3);

        // time ->
        const tx = graphOrigin[0] + textSize / 2;
        const ty = graphOrigin[1] + graphSize[1] + textSize;

        ctx.fillText("time ->", tx, ty);

        const topUsers = allData
            .sort((a, b) => b.messages - a.messages)
            .filter((x) => !x.hasLeft)
            .slice(0, 10)
            .map((x, i) => `\`${i + 1}.\` ${userMention(x._id)}: ${x.messages.toLocaleString("en-US")}`)
            .join("\n");

        await interaction.reply({
            files: [new AttachmentBuilder(img.toBuffer("image/png"), { name: "dailyMsgs.png" })],
            embeds: [new EmbedBuilder()
                .setTitle("Ranking leaderboard")
                .setDescription(`A total of **${messageCountsTotal.toLocaleString("en-US")}** messages have been recorded in this server.`)
                .addFields({ name: "Top users by messages sent:", value: topUsers })
                .setImage("attachment://dailyMsgs.png")
                .setColor(interaction.client.config.EMBED_COLOR)
            ]
        });
    },
    data: {
        name: "rank",
        description: "Ranking system",
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "view",
                description: "View a member's ranking information",
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: "member",
                        description: "The member whose rank to view",
                        required: false
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: "leaderboard",
                description: "View the top 10 users in the ranking system"
            }
        ]
    }
});
