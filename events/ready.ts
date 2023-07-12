import YClient from '../client.js';
import { getChan, log, mainGuild } from '../utilities.js';
import { LogColor } from '../typings.js';


export default async (client: YClient) => {
    const guild = mainGuild(client);

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => log(LogColor.Purple, 'Slash commands registered'))
        .catch(e => log(LogColor.Red, 'Couldn\'t register commands: ', e));
        
    for (const [code, inv] of await guild.invites.fetch()) client.invites.set(code, { uses: inv.uses, creator: inv.inviter?.id });

    await getChan(client, 'taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.botSwitches, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    log(LogColor.Blue, `Bot active as ${client.user?.tag}`);
}
