import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder, inlineCode, time } from "discord.js";
import { Command } from "../../structures/index.js";
import {
    formatRequestInit,
    formatString,
    formatTime,
    hasRole,
    log,
    youNeedRole
} from "../../util/index.js";
import type { MinecraftPlayer } from "../../typings.js";

export default new Command<"chatInput">({
    async run(interaction) {
        if (!hasRole(interaction.member, "irtmcplayer")) return await youNeedRole(interaction, "irtmcplayer");

        const subCmd = interaction.options.getSubcommand() as "players" | "time" | "deaths" | "view";

        if (subCmd === "view") {
            const username = interaction.options.getString("username", true);
            const playerData = await interaction.client.mcPlayerTimes.data.findOne({ playerName: username });

            if (!playerData) return await interaction.reply(`No data found with that name. [Find out why.](${interaction.client.config.resources.statsNoDataRedirect})`);

            const imageBuffer = await fetch(`https://crafatar.com/avatars/${playerData._id.replace("-", "")}.png`).then(x => x.arrayBuffer());
            const isOnline = interaction.client.mcCache[playerData._id];

            return await interaction.reply({
                files: [new AttachmentBuilder(Buffer.from(imageBuffer), { name: "profilePicture.png" })],
                embeds: [new EmbedBuilder()
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .setTitle([
                        `Player - \`${playerData.playerName}\``,
                        `Total time - **${formatTime(playerData.time, 5, { commas: true })}**`,
                        `Total deaths - **${playerData.deaths.toLocaleString("en-US")}**`,
                        `Last on - ${isOnline ? "Now" : time(Math.round(playerData.lastOn / 1_000), "R")}`
                    ].join("\n"))
                    .setThumbnail("attachment://profilePicture.png")
                ]
            });
        } else if (subCmd === "players") {
            const players = await fetch(
                interaction.client.config.minecraft.address + "/players",
                formatRequestInit(2_000, "IRTMC", { Authorization: `Basic ${Buffer.from(interaction.client.config.minecraft.authorization).toString("base64")}` })
            )
                .then(x => x.json() as Promise<MinecraftPlayer[]>)
                .catch(() => log("Red", "IRTMC failed"));

            if (!players) return await interaction.reply("Server did not respond");

            const formattedPlayers = players.map(player => {
                const playerUptime = interaction.client.mcCache[player.uuid]
                    ? formatTime(Date.now() - interaction.client.mcCache[player.uuid].joinTime, 3)
                    : "Unknown play duration";

                return `\`${player.name}\` **|** ${playerUptime}`;
            });

            return await interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle("Players currently on IRTMC")
                .setColor(interaction.client.config.EMBED_COLOR)
                .setDescription(formattedPlayers.join("\n") || "None")
            ] });
        }

        const fullData = await interaction.client.mcPlayerTimes.data.find();
        const formattedData = fullData.sort((a, b) => b[subCmd] - a[subCmd]).map((player, index) => {
            const displayNum = subCmd === "time"
                ? formatTime(player.time, 3, { commas: true })
                : player.deaths.toLocaleString("en-US");
            
            return `**${index + 1}.** ${inlineCode(player.playerName)} - ${displayNum}`;
        }).join("\n");

        await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle(`${formatString(subCmd)} leaderboard for players of IRTMC`)
            .setColor(interaction.client.config.EMBED_COLOR)
            .setDescription(formattedData + "\u200b")
        ] });
    },
    data: new SlashCommandBuilder()
        .setName("irtmc")
        .setDescription("Player data for the IRTMC Minecraft server")
        .addSubcommand(x => x
            .setName("players")
            .setDescription("View a list of players currently on the server"))
        .addSubcommand(x => x
            .setName("time")
            .setDescription("View time-based leaderboard data for all IRTMC players"))
        .addSubcommand(x => x
            .setName("deaths")
            .setDescription("View death-based leaderboard data for all IRTMC players"))
        .addSubcommand(x => x
            .setName("view")
            .setDescription("View an individual player's data")
            .addStringOption(x => x
                .setName("username")
                .setDescription("The name of the player to search for")
                .setRequired(true))) 

});