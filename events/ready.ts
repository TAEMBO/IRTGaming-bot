import YClient from '../client.js';
import { getChan, log } from '../utilities.js';
import { LogColor } from '../typings.js';


export default async (client: YClient) => {
    const guild = await client.guilds.fetch(client.config.mainServer.id);
    await guild.members.fetch();

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => log(LogColor.Purple, 'Slash commands registered'))
        .catch(e => log(LogColor.Red, 'Couldn\'t register commands: ', e));
        
    setInterval(async () => {
        (await guild.invites.fetch()).forEach(inv => client.invites.set(inv.code, { uses: inv.uses, creator: inv.inviter?.id }));
        client.user?.setPresence(client.config.botPresence);
    }, 7_200_000);

    await getChan(client, 'taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.botSwitches, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    log(LogColor.Blue, `Bot active as ${client.user?.tag}`);
}
