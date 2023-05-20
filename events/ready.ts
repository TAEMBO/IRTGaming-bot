import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient) => {
    const guild = await client.guilds.fetch(client.config.mainServer.id);
    const channel = guild.channels.resolve(client.config.mainServer.channels.taesTestingZone) as Discord.TextChannel;
    await guild.members.fetch();

    if (client.config.botSwitches.registerCommands) guild.commands.set(client.registry)
        .then(() => client.log('\x1b[35m', 'Slash commands registered'))
        .catch(e => client.log('\x1b[31m', 'Couldn\'t register commands:', e));
        
    setInterval(async () => {
        (await guild.invites.fetch()).forEach(inv => client.invites.set(inv.code, { uses: inv.uses, creator: inv.inviter?.id }));
        client.user?.setPresence(client.config.botPresence);
    }, 7_200_000);

    await channel.send([
        ':warning: Bot restarted :warning:',
        `<@${client.config.devWhitelist[0]}>`,
        `\`\`\`json\n${Object.entries(client.config.botSwitches).map(x => `${x[0]}: ${x[1]}`).join('\n')}\`\`\``
    ].join('\n'));

    client.log('\x1b[34m', `Bot active as ${client.user?.tag}`);
}
