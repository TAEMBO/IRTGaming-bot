import { EmbedBuilder } from 'discord.js';
import YClient from './client.js';

const client = new YClient();

console.log(client.config.botSwitches);
console.log(client.config.devWhitelist);
console.log(Object.keys(client.config.fs));

/** Error handler */
function errorLog(error: Error) {
    if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) return;

    const dirname = process.cwd().replaceAll('\\', '/');
    const channel = client.getChan('taesTestingZone');
    const formattedErr = error.stack
        ?.replaceAll(' at ', ' [31mat[37m ')
        .replaceAll(dirname, `[33m${dirname}[37m`)
        .slice(0, 2500);

    if (!channel) return console.log(error);

    channel.send({
        content: `<@${client.config.devWhitelist[0]}>`,
        embeds: [new EmbedBuilder()
            .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
            .setColor("#420420")
            .setDescription(`\`\`\`ansi\n${formattedErr}\`\`\``)
            .setTimestamp()
        ]
    });
}

process.on('unhandledRejection', errorLog);
process.on('uncaughtException', errorLog);
process.on('error', errorLog);
client.on('error', errorLog);
