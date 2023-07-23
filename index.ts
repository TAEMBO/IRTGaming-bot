import { EmbedBuilder } from 'discord.js';
import YClient from './client.js';

const client = new YClient();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);

/** Error handler */
function errorLog(error: Error, event: string) {
    if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) return;

    const dirname = process.cwd().replaceAll('\\', '/');
    const channel = client.getChan('taesTestingZone');

    if (!channel) return console.log(error);

    channel.send({
        content: `<@${client.config.devWhitelist[0]}>`,
        embeds: [new EmbedBuilder()
            .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
            .setColor("#420420")
            .setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`).slice(0, 2500)}\`\`\``)
            .setTimestamp()
            .setFooter({ text: event })
        ]
    });
}

process.on('unhandledRejection', (error: Error) => errorLog(error, 'unhandledRejection'));
process.on('uncaughtException', error => errorLog(error, 'uncaughtException'));
process.on('error', error => errorLog(error, 'process-error'));
client.on('error', error => errorLog(error, 'client-error'));
