import Discord, { SlashCommandBuilder } from 'discord.js';
import YClient from '../client.js';
import util from 'node:util';
import { exec } from 'child_process';
import * as utilities from '../utilities.js';
import fs from 'node:fs';
import { LogColor } from '../typings.js';

export default {
	async run(client: YClient, interaction: Discord.ChatInputCommandInteraction<"cached">) {
		if (!client.config.devWhitelist.includes(interaction.user.id)) return interaction.reply('You\'re not allowed to use dev commands.');
        
		({
			eval: async () => {
                utilities;
                fs;
                LogColor;
                const code = interaction.options.getString("code", true);
                const useAsync = Boolean(interaction.options.getBoolean("async", false));
                const embed = new client.embed()
                    .setTitle('__Eval__')
                    .setColor(client.config.embedColor)
                    .addFields({ name: 'Input', value: `\`\`\`js\n${code.slice(0, 1010)}\n\`\`\`` });
                    let output = 'error';
				
                try {
					output = await eval(useAsync ? `(async () => { ${code} })()` : code);
                } catch (err: any) {
                    embed.setColor('#ff0000').addFields({ name: 'Output', value: `\`\`\`\n${err}\n\`\`\`` });

                    await interaction.reply({ embeds: [embed] }).catch(() => interaction.channel?.send({ embeds: [embed] }));

                    interaction.channel?.createMessageCollector({
                        filter: x => x.content === 'stack' && x.author.id === interaction.user.id,
                        max: 1,
                        time: 60_000
                    }).on('collect', msg => {
                        const dirname = process.cwd().replaceAll('\\', '/');

                        msg.reply({
                            content: `\`\`\`ansi\n${err.stack.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`)}\n\`\`\``,
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
                for (const credential of [client.config.token] // Bot token
                    .concat(Object.values(client.config.fs).map(x => x.login)) // Dedi panel logins
                    .concat(Object.values(client.config.ftp).map(x => x.password)) // FTP passwords
                ) output = output.replace(credential, 'CREDENTIAL_LEAK');

                embed.addFields({ name: 'Output', value: `\`\`\`${output.slice(0, 1016)}\n\`\`\`` });

                interaction.reply({ embeds: [embed] }).catch(() => interaction.channel?.send({ embeds: [embed] }));
            },
            statsgraph: () => {
                client.config.statsGraphSize = -(interaction.options.getInteger('number', true));
                interaction.reply(`Set to \`${client.config.statsGraphSize}\``);
            },
            restart: async () => {
                await interaction.reply('Compiling...');

                exec('tsc', (error, stdout) => {
                    if (error) return interaction.editReply(error.message);

                    interaction.editReply('Restarting...').then(() => process.exit(-1));
                });
            },
            update: async () => {
                await interaction.reply('Pulling from repo...');

                exec('git pull', async (error, stdout) => {
                    if (error) {
                        interaction.editReply(`Pull failed:\n\`\`\`${error.message}\`\`\``);
                    } else if (stdout.includes('Already up to date')) {
                        interaction.editReply(`Pull aborted:\nUp-to-date`);
                    } else {
                        await interaction.editReply('Compiling...');

                        exec('tsc', (error, stdout) => {
                            if (error) return interaction.editReply(error.message);

                            interaction.editReply('Restarting...').then(() => process.exit(-1));
                        });
                    }
                });
            },
            dz: () => interaction.reply('PC has committed iWoke:tm:').then(() => exec('start C:/WakeOnLAN/WakeOnLanC.exe -w -m Desktop')),
            presence: () => {
                function convertType(Type?: number) {
                    return {
                        0: 'Playing',
                        2: 'Listening',
                        3: 'Watching',
                        5: 'Competing',
                        default: undefined
                    }[Type || 'default'];
                }

                const status = interaction.options.getString('status') as Discord.PresenceStatusData | null;
                const type = interaction.options.getInteger('type');
                const name = interaction.options.getString('name');
                const currentActivities = client.config.botPresence.activities as Discord.ActivitiesOptions[];

                if (status) client.config.botPresence.status = status;
                if (type) currentActivities[0].type = type;
                if (name) currentActivities[0].name = name;

                client.user?.setPresence(client.config.botPresence);

                interaction.reply([
                    `Status: **${client.config.botPresence.status}**`,
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
			.setName('dz')
			.setDescription('Wheezing Over Life'))
		.addSubcommand(x=>x
			.setName('presence')
			.setDescription('Update the bot\'s presence')
			.addIntegerOption(x=>x
				.setName('type')
				.setDescription('The activity type to set')
				.addChoices(
					{ name: 'Playing', value: Discord.ActivityType.Playing },
					{ name: 'Listening', value: Discord.ActivityType.Listening },
					{ name: 'Watching', value: Discord.ActivityType.Watching },
					{ name: 'Competing', value: Discord.ActivityType.Competing }))
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
