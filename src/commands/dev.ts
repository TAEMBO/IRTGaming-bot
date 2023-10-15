import Discord, {
    SlashCommandBuilder,
    EmbedBuilder,
    PresenceStatusData,
    ActivityType,
    ActivitiesOptions,
    PresenceUpdateStatus,
    codeBlock,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from 'discord.js';
import util from 'node:util';
import { exec } from 'child_process';
import * as utilities from '../utilities.js';
import fs from 'node:fs';
import { Index, TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		if (!interaction.client.config.devWhitelist.includes(interaction.user.id)) return await interaction.reply('You\'re not allowed to use dev commands.');
        
		await ({
			async eval() {
                fs; Discord; // Imports possibly used in eval
                const now = Date.now();
                const { client } = interaction;
                const code = interaction.options.getString("code", true);
                const useAsync = Boolean(interaction.options.getBoolean("async", false));
                const fsServers = new utilities.FSServers(interaction.client.config.fs);
                const embed = new EmbedBuilder()
                    .setTitle('__Eval__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields({ name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\`` });
                let output: any = 'error';
				
                try {
                    output = await eval(useAsync ? `(async () => { ${code} })()` : code);
                } catch (err: any) {
                    embed
                        .setColor('#ff0000')
                        .addFields({
                            name: `Output • ${Date.now() - now}ms`,
                            value: `\`\`\`\n${err}\n\`\`\``
                        });

                    const msgPayload = {
                        embeds: [embed],
                        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('stack').setStyle(ButtonStyle.Primary).setLabel('Stack'))],
                        fetchReply: true as true
                    };

                    const msg = await interaction.reply(msgPayload).catch(() => interaction.channel.send(msgPayload));

                    msg.createMessageComponentCollector({
                        filter: x => x.user.id === interaction.user.id,
                        max: 1,
                        time: 60_000,
                        componentType: ComponentType.Button
                    }).on('collect', async int => {
                        await int.reply(`\`\`\`\n${err.stack}\n\`\`\``);
                    }).on('end', async ints => {
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

                for (const credential of [client.config.token]
                    .concat(fsObj.map(x => x.login))
                    .concat(fsObj.map(x => x.dss))
                    .concat(fsObj.map(x => x.csg))
                    .concat(fsPub.map(x => x[1].ftp.host))
                    .concat(fsPub.map(x => x[1].ftp.password))
                ) output = output.replace(credential, 'CREDENTIAL_LEAK');

                embed.addFields({ name: `Output • ${Date.now() - now}ms`, value: `\`\`\`${output.slice(0, 1016)}\n\`\`\`` });

                await interaction.reply({ embeds: [embed] }).catch(() => interaction.channel?.send({ embeds: [embed] }));
            },
            async restart() {
                await interaction.reply('Compiling...');

                exec('tsc', async (error, stdout) => {
                    if (error) return await interaction.editReply(codeBlock(stdout.slice(0, 2000)));

                    await interaction.editReply('Restarting...').then(() => process.exit(-1));
                });
            },
            async update() {
                await interaction.reply('Pulling from repo...');

                exec('git pull', async (error, stdout) => {
                    if (error) return await interaction.editReply(`Pull failed:\n\`\`\`${error.message}\`\`\``);

                    if (stdout.includes('Already up to date')) return await interaction.editReply(`Pull aborted:\nUp-to-date`);

                    await interaction.editReply('Compiling...');

                    exec('tsc', async (error, _) => {
                        if (error) return await interaction.editReply(error.message);

                        await interaction.editReply('Restarting...').then(() => process.exit(-1));
                    });
                });
            },
            async presence() {
                function convertType(type?: number) {
                    return {
                        0: 'Playing',
                        2: 'Listening to',
                        3: 'Watching',
                        4: 'Custom',
                        5: 'Competing in',
                        default: undefined
                    }[type ?? 'default'];
                }

                const status = interaction.options.getString('status') as PresenceStatusData | null;
                const type = interaction.options.getInteger('type') as ActivityType | null;
                const name = interaction.options.getString('name');
                const currentActivities = interaction.client.config.botPresence.activities as ActivitiesOptions[];

                if (status) interaction.client.config.botPresence.status = status;
                if (type !== null) currentActivities[0].type = type;
                if (name) currentActivities[0].name = name;

                interaction.client.user?.setPresence(interaction.client.config.botPresence);

                await interaction.reply([
                    `Status: **${interaction.client.config.botPresence.status}**`,
                    `Type: **${convertType(currentActivities[0].type)}**`,
                    `Name: **${currentActivities[0].name}**`
                ].join('\n'));
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
        .addSubcommand(x => x
            .setName('presence')
            .setDescription('Update the bot\'s presence')
            .addIntegerOption(x => x
                .setName('type')
                .setDescription('The activity type to set')
                .addChoices(
                    { name: 'Playing', value: ActivityType.Playing },
                    { name: 'Listening to', value: ActivityType.Listening },
                    { name: 'Watching', value: ActivityType.Watching },
                    { name: 'Custom', value: ActivityType.Custom },
                    { name: 'Competing in', value: ActivityType.Competing }))
            .addStringOption(x => x
                .setName('name')
                .setDescription('The activity name to set'))
            .addStringOption(x => x
                .setName('status')
                .setDescription('The status to set')
                .addChoices(
                    { name: 'Online', value: PresenceUpdateStatus.Online },
                    { name: 'Idle', value: PresenceUpdateStatus.Idle },
                    { name: 'DND', value: PresenceUpdateStatus.DoNotDisturb },
                    { name: 'Invisible', value: PresenceUpdateStatus.Invisible })))
};
