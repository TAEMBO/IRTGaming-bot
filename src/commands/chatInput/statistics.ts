import { EmbedBuilder, version } from "discord.js";
import os from "node:os";
import { Command } from "#structures";
import { formatTime } from "#util";

export default new Command<"chatInput">({
    async run(interaction) {
        const colunms = ["Command Name", "Uses"] as const;
        const includedCommands = interaction.client.chatInputCommands.filter(x => x.uses).sort((a, b) => b.uses - a.uses);

        if (!includedCommands.size) return await interaction.reply(
            "No commands have been used yet.\n"
            + `Uptime: ${formatTime(interaction.client.uptime, 2, { commas: true, longNames: true })}`
        );

        const nameLength = Math.max(...includedCommands.map(x => x.data.name.length), colunms[0].length) + 2;
        const amountLength = Math.max(...includedCommands.map(x => x.uses.toString().length), colunms[1].length) + 1;
        const rows = [
            `${colunms[0] + " ".repeat(nameLength - colunms[0].length)}|${" ".repeat(amountLength - colunms[1].length) + colunms[1]}\n`,
            "-".repeat(nameLength) + "-".repeat(amountLength) + "\n"
        ];

        for (const [_, command] of includedCommands) {
            const name = command.data.name;
            const count = command.uses.toString();

            rows.push(`${name + ".".repeat(nameLength - name.length)}${".".repeat(amountLength - count.length) + count}\n`);
        }

        const embed = new EmbedBuilder()
            .setTitle("Bot Statistics")
            .setDescription(
                "List of commands that have been used."
                + `Total amount of commands used since last restart: **${interaction.client.chatInputCommands.reduce((a, b) => a + b.uses, 0)}**`
            )
            .setColor(interaction.client.config.EMBED_COLOR);

        if (rows.join("").length > 1024) {
            let fieldValue = "";

            for (const row of rows) {
                if (fieldValue.length + row.length > 1024) {
                    embed.addFields({ name: "\u200b", value: `\`\`\`\n${fieldValue}\`\`\`` });
                    fieldValue = row;
                } else fieldValue += row;
            }

            embed.addFields({ name: "\u200b", value: `\`\`\`\n${fieldValue}\`\`\`` });
        } else embed.addFields({ name: "\u200b", value: `\`\`\`\n${rows.join("")}\`\`\`` });

        const ramUsage = [
            process.memoryUsage().heapUsed,
            process.memoryUsage().heapTotal,
            os.freemem()
        ].map(bytes => {
            if (!bytes) return "0 Bytes";

            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(1_000));

            return (bytes / Math.pow(1_000, i)).toFixed(1) + " " + sizes[i];
        }).join("**/**");

        embed.addFields({
            name: "Misc. Stats",
            value: [
                `**RAM Usage:** ${ramUsage}`,
                `**Node.js Version:** ${process.version}`,
                `**Discord.js Version:** v${version}`,
                `**Bot Uptime:** ${formatTime(interaction.client.uptime, 2, { commas: true, longNames: true })}`,
                `**Host Uptime:** ${formatTime((os.uptime() * 1000), 2, { commas: true, longNames: true })}`
            ].join("\n")
        });

        await interaction.reply({ embeds: [embed] });
    },
    data: {
        name: "statistics",
        description: "See statistics for the bot itself"
    }
});
