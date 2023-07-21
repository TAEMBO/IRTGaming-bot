import YClient from '../client.js';
import { log } from '../utilities.js';

export default async (client: YClient) => {
    const guild = client.mainGuild();

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => log('Purple', 'Slash commands registered'))
        .catch(e => log('Red', 'Couldn\'t register commands: ', e));
        
    for (const [code, inv] of await guild.invites.fetch()) client.invites.set(code, { uses: inv.uses, creator: inv.inviter?.id });

    await client.getChan('taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.botSwitches, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    log('Blue', `Bot active as ${client.user?.tag}`);
}
