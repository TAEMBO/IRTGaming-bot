import YClient from '../client.js';
import { LogColor } from '../typings.js';

export default async (client: YClient) => {
    const guild = await client.guilds.fetch(client.config.mainServer.id);
    await guild.members.fetch();

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => client.log(LogColor.Purple, 'Slash commands registered'))
        .catch(e => client.log(LogColor.Red, 'Couldn\'t register commands: ', e));
        
    setInterval(async () => {
        (await guild.invites.fetch()).forEach(inv => client.invites.set(inv.code, { uses: inv.uses, creator: inv.inviter?.id }));
        client.user?.setPresence(client.config.botPresence);
    }, 7_200_000);

    await client.getChan('taesTestingZone').send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${JSON.stringify(client.config.botSwitches, null, 1).slice(1, -1)}\`\`\``
    ].join('\n'));

    client.log(LogColor.Blue, `Bot active as ${client.user?.tag}`);
}
