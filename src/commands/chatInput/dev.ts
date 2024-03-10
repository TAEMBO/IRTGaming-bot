import Discord, {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    codeBlock,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import { exec } from "child_process";
import fs from "node:fs";
import { performance } from "perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";
import util from "node:util";
import * as structures from "../../structures/index.js";
import * as utilities from "../../util/index.js";
import { Feeds, DSSExtension, MapSize, DSSFile, DSSObject } from "farming-simulator-types/2022";

export default new structures.Command<"chatInput">({
    async run(interaction) {
        if (!interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply("You're not allowed to use dev commands.");
        
        Feeds.dedicatedServerStats("aa", DSSExtension.JSON);

        const h = {} as DSSObject;

        h.server?.server;

        const num: MapSize = 2048;

        num;

        Feeds.dedicatedServerSavegame("", DSSFile.Economy);
        Feeds.dedicatedServerStats("", DSSExtension.XML);
        Feeds.dedicatedServerStatsMap("", 60, 256);

        await utilities.lookup({
            async eval() {
                sleep; fs; Discord; // Imports possibly used in eval
                const { client } = interaction;
                const code = interaction.options.getString("code", true);
                const useAsync = Boolean(interaction.options.getBoolean("async", false));
                const fsServers = new structures.FSServers(interaction.client.config.fs);
                const embed = new EmbedBuilder()
                    .setTitle("__Eval__")
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .addFields({ name: "Input", value: codeBlock("js", code.slice(0, 1010)) });
                const now = performance.now();
                let output;

                try {
                    output = await eval(useAsync ? `(async () => { ${code} })()` : code);
                } catch (err: any) {
                    console.log(err);
                    
                    embed
                        .setColor("#ff0000")
                        .addFields({
                            name: `Output • ${(performance.now() - now).toFixed(5)}ms`,
                            value: codeBlock(err)
                        });

                    const msgPayload = {
                        embeds: [embed],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("stack").setStyle(ButtonStyle.Primary).setLabel("Stack"))],
                        fetchReply: true as const
                    };

                    const msg = await interaction.reply(msgPayload).catch(() => interaction.channel!.send(msgPayload));

                    msg.createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000,
                        componentType: ComponentType.Button
                    })
                        .on("collect", int => void int.reply(codeBlock(err.stack.slice(0, 1950))))
                        .on("end", () => void msg.edit({ embeds: msg.embeds, components: [] }));
                    
                    return;
                }

                // Output manipulation
                if (typeof output === "object") {
                    output = "js\n" + util.formatWithOptions({ depth: 0 }, "%O", output);
                } else output = "\n" + String(output);

                // Hide credentials
                const fsPub = fsServers.getPublicAll();
                const fsObj = fsServers.values();

                for (const credential of [
                    client.config.TOKEN,
                    ...fsObj.map(x => x.password),
                    ...fsObj.map(x => x.code),
                    ...fsPub.map(x => x[1].ftp.host),
                    ...fsPub.map(x => x[1].ftp.password)
                ]) output = output.replace(credential, "CREDENTIAL_LEAK");

                embed.addFields({ name: `Output • ${(performance.now() - now).toFixed(5)}ms`, value: `\`\`\`${output.slice(0, 1016)}\n\`\`\`` });

                await interaction.reply({ embeds: [embed] }).catch(() => interaction.channel!.send({ embeds: [embed] }));
            },
            async restart() {
                interaction.replied ? await interaction.editReply("Compiling...") : await interaction.reply("Compiling...");

                exec("tsc", async (error, stdout) => {
                    if (error) return await interaction.editReply(codeBlock(stdout.slice(0, 1950)));

                    await interaction.editReply("Restarting...").then(() => process.exit(-1));
                });
            },
            async update() {
                await interaction.reply("Pulling from repo...");

                exec("git pull", async (error, stdout) => {
                    if (error) return await interaction.editReply(`Pull failed:\n\`\`\`${error.message}\`\`\``);

                    if (stdout.includes("Already up to date")) return await interaction.editReply("Pull aborted:\nUp-to-date");

                    await this.restart();
                });
            }
        }, interaction.options.getSubcommand());
    },
    data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Run bot-dev-only commands")
        .addSubcommand(x => x
            .setName("eval")
            .setDescription("Execute code within the bot")
            .addStringOption(x => x
                .setName("code")
                .setDescription("The code to execute")
                .setRequired(true))
            .addBooleanOption(x => x
                .setName("async")
                .setDescription("Whether to wrap the code in an async block or not")))
        .addSubcommand(x => x
            .setName("restart")
            .setDescription("Restart the bot"))
        .addSubcommand(x => x
            .setName("update")
            .setDescription("Pull from GitHub repository to live bot"))
});
