import YClient from '../client.js';

/**
 * Error handler
 * @param client 
 * @param error The error itself
 * @param event The name of the event that this error originated from
 */
export function errorLog(client: YClient, error: Error, event: string) {
    if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message) || !client.isReady()) return;

    const dirname = process.cwd().replaceAll('\\', '/');

    client.getChan('taesTestingZone').send({
        content: `<@${client.config.devWhitelist[0]}>`,
        embeds: [new client.embed()
            .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
            .setColor("#420420")
            .setDescription(`\`\`\`ansi\n${error.stack?.replaceAll(' at ', ' [31mat[37m ').replaceAll(dirname, `[33m${dirname}[37m`).slice(0, 2500)}\`\`\``)
            .setTimestamp()
            .setFooter({ text: event })
        ]
    });
}