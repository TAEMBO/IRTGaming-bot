import Discord, { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import util from 'node:util';
import { exec } from 'child_process';
import * as utilities from '../utilities.js';
import fs from 'node:fs';
import { TInteraction } from '../typings.js';

export default {
	async run(interaction: TInteraction) {
		if (!interaction.client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('You\'re not allowed to use dev commands.');
        
		({
			eval: async () => {
                fs;
                const now = Date.now();
                const { client } = interaction;
                const code = interaction.options.getString("code", true);
                const useAsync = Boolean(interaction.options.getBoolean("async", false));
                const fsServers = new utilities.FSServers(interaction.client.config.fs);
                const embed = new EmbedBuilder()
                    .setTitle('__Eval__')
                    .setColor(interaction.client.config.embedColor)
                    .addFields({ name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\`` });
                let output = 'error';
				
                try {
                    output = await eval(useAsync ? `(async () => { ${code} })()` : code);
                } catch (err: any) {
                    function colorCode(err: any): string {
                        const dirname = process.cwd().replaceAll('\\', '/');

                        return err.stack.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`);
                    }

                    embed
                        .setColor('#ff0000')
                        .addFields({
                            name: `Output • ${err.message.slice(0, 245)}`,
                            value: `\`\`\`ansi\n${colorCode(err).slice(0, 1010)}\n\`\`\``
                        });

                    await interaction.reply({ embeds: [embed] }).catch(() => interaction.channel?.send({ embeds: [embed] }));

                    interaction.channel?.createMessageCollector({
                        filter: x => x.content === 'stack' && x.author.id === interaction.user.id,
                        max: 1,
                        time: 60_000
                    }).on('collect', msg => {
                        msg.reply({
                            content: `\`\`\`ansi\n${colorCode(err)}\n\`\`\``,
                            allowedMentions: { repliedUser: false }
                        });
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

                interaction.reply({ embeds: [embed] }).catch(() => interaction.channel?.send({ embeds: [embed] }));
            },
            statsgraph: () => {
                interaction.client.config.statsGraphSize = -(interaction.options.getInteger('number', true));
                interaction.reply(`Set to \`${interaction.client.config.statsGraphSize}\``);
            },
            restart: async () => {
                await interaction.reply('Compiling...');

                exec('tsc', (error, _) => {
                    if (error) return console.log(error);

                    interaction.editReply('Restarting...').then(() => process.exit(-1));
                });
            },
            update: async () => {
                await interaction.reply('Pulling from repo...');

                exec('git pull', async (error, stdout) => {
                    if (error) return interaction.editReply(`Pull failed:\n\`\`\`${error.message}\`\`\``);

                    if (stdout.includes('Already up to date')) return interaction.editReply(`Pull aborted:\nUp-to-date`);

                    await interaction.editReply('Compiling...');

                    exec('tsc', (error, _) => {
                        if (error) return interaction.editReply(error.message);

                        interaction.editReply('Restarting...').then(() => process.exit(-1));
                    });
                });
            },
            presence: () => {
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

                const status = interaction.options.getString('status') as Discord.PresenceStatusData | null;
                const type = interaction.options.getInteger('type') as Discord.ActivityType | null;
                const name = interaction.options.getString('name');
                const currentActivities = interaction.client.config.botPresence.activities as Discord.ActivitiesOptions[];

                if (status) interaction.client.config.botPresence.status = status;
                if (type !== null) currentActivities[0].type = type;
                if (name) currentActivities[0].name = name;

                interaction.client.user?.setPresence(interaction.client.config.botPresence);

                interaction.reply([
                    `Status: **${interaction.client.config.botPresence.status}**`,
                    `Type: **${convertType(currentActivities[0].type)}**`,
                    `Name: **${currentActivities[0].name}**`
                ].join('\n'));
            }
        } as any)[interaction.options.getSubcommand()]();
	},
	data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Run bot-dev-only commands")
        .addSubcommand(x=>x
            .setName('eval')
            .setDescription('Execute code within the bot')
            .addStringOption(x=>x
                .setName("code")
                .setDescription("The code to execute")
                .setRequired(true))
            .addBooleanOption(x=>x
                .setName('async')
                .setDescription('Whether to wrap the code in an async block or not')))
        .addSubcommand(x=>x
            .setName('restart')
            .setDescription('Restart the bot'))
        .addSubcommand(x=>x
            .setName('update')
            .setDescription('Pull from GitHub repository to live bot'))
        .addSubcommand(x=>x
            .setName('statsgraph')
            .setDescription('Edit the number of data points pulled')
            .addIntegerOption(x=>x
                .setName("number")
                .setDescription("The number of data points to pull")
                .setRequired(true)))
        .addSubcommand(x=>x
            .setName('presence')
            .setDescription('Update the bot\'s presence')
            .addIntegerOption(x=>x
                .setName('type')
                .setDescription('The activity type to set')
                .addChoices(
                    { name: 'Playing', value: Discord.ActivityType.Playing },
                    { name: 'Listening to', value: Discord.ActivityType.Listening },
                    { name: 'Watching', value: Discord.ActivityType.Watching },
                    { name: 'Custom', value: Discord.ActivityType.Custom },
                    { name: 'Competing in', value: Discord.ActivityType.Competing }))
            .addStringOption(x=>x
                .setName('name')
                .setDescription('The activity name to set'))
            .addStringOption(x=>x
                .setName('status')
                .setDescription('The status to set')
                .addChoices(
                    { name: 'Online', value: Discord.PresenceUpdateStatus.Online },
                    { name: 'Idle', value: Discord.PresenceUpdateStatus.Idle },
                    { name: 'DND', value: Discord.PresenceUpdateStatus.DoNotDisturb },
                    { name: 'Invisible', value: Discord.PresenceUpdateStatus.Invisible })))
};
