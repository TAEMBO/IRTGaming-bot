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
import { setTimeout as sleep } from "node:timers/promises";
import util from "node:util";
import * as utilities from "../../utils.js";
import type { Index } from "../../typings.js";

export default new utilities.Command<"chatInput">({
	async run(interaction) {
		if (!interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply('You\'re not allowed to use dev commands.');
        
		await ({
			async eval() {
                sleep; fs; Discord; // Imports possibly used in eval
                const now = Date.now();
                const { client } = interaction;
                const code = interaction.options.getString("code", true);
                const useAsync = Boolean(interaction.options.getBoolean("async", false));
                const fsServers = new utilities.FSServers(interaction.client.config.fs);
                const embed = new EmbedBuilder()
                    .setTitle('__Eval__')
                    .setColor(interaction.client.config.EMBED_COLOR)
                    .addFields({ name: 'Input', value: codeBlock("js", code.slice(0, 1010)) });
                let output: any = 'error';
				
                try {
                    output = await eval(useAsync ? `(async () => { ${code} })()` : code);
                } catch (err: any) {
                    embed
                        .setColor('#ff0000')
                        .addFields({
                            name: `Output • ${Date.now() - now}ms`,
                            value: codeBlock(err)
                        });

                    const msgPayload = {
                        embeds: [embed],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('stack').setStyle(ButtonStyle.Primary).setLabel('Stack'))],
                        fetchReply: true as true
                    };

                    const msg = await interaction.reply(msgPayload).catch(() => interaction.channel!.send(msgPayload));

                    msg.createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000,
                        componentType: ComponentType.Button
                    }).on('collect', async int => {
                        await int.reply(codeBlock(err.stack.slice(0, 1950)));
                    }).on('end', async () => {
                        await msg.edit({ embeds: msg.embeds, components: [] });
                    });
                    
                    return;
                }

                // Output manipulation
                if (typeof output === 'object') {
                    output = 'js\n' + util.formatWithOptions({ depth: 1 }, '%O', output);
                } else output = '\n' + String(output);

                // Hide credentials
                const fsPub = fsServers.getPublicAll();
                const fsObj = fsServers.values();

                for (const credential of [client.config.TOKEN]
                    .concat(fsObj.map(x => x.password))
                    .concat(fsObj.map(x => x.code))
                    .concat(fsPub.map(x => x[1].ftp.host))
                    .concat(fsPub.map(x => x[1].ftp.password))
                ) output = output.replace(credential, 'CREDENTIAL_LEAK');

                embed.addFields({ name: `Output • ${Date.now() - now}ms`, value: `\`\`\`${output.slice(0, 1016)}\n\`\`\`` });

                await interaction.reply({ embeds: [embed] }).catch(() => interaction.channel!.send({ embeds: [embed] }));
            },
            async restart() {
                interaction.replied ? await interaction.editReply("Compiling...") : await interaction.reply("Compiling...");

                exec('tsc', async (error, stdout) => {
                    if (error) return await interaction.editReply(codeBlock(stdout.slice(0, 1950)));

                    await interaction.editReply('Restarting...').then(() => process.exit(-1));
                });
            },
            async update() {
                await interaction.reply('Pulling from repo...');

                exec('git pull', async (error, stdout) => {
                    if (error) return await interaction.editReply(`Pull failed:\n\`\`\`${error.message}\`\`\``);

                    if (stdout.includes('Already up to date')) return await interaction.editReply(`Pull aborted:\nUp-to-date`);

                    await this.restart();
                });
            }
        } as Index)[interaction.options.getSubcommand()]();
	},
	data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Run bot-dev-only commands")
        .addSubcommand(x => x
            .setName('eval')
            .setDescription('Execute code within the bot')
            .addStringOption(x => x
                .setName("code")
                .setDescription("The code to execute")
                .setRequired(true))
            .addBooleanOption(x => x
                .setName('async')
                .setDescription('Whether to wrap the code in an async block or not')))
        .addSubcommand(x => x
            .setName('restart')
            .setDescription('Restart the bot'))
        .addSubcommand(x => x
            .setName('update')
            .setDescription('Pull from GitHub repository to live bot'))
});
