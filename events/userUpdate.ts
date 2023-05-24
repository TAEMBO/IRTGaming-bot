import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, oldUser: Discord.User | Discord.PartialUser, newUser: Discord.User) => {
    if (!client.config.botSwitches.logs || oldUser.tag === newUser.tag) return;

    (client.channels.resolve(client.config.mainServer.channels.botLogs) as Discord.TextChannel).send({ embeds: [new client.embed()
        .setTimestamp()
        .setColor(client.config.embedColor)
        .setTitle(`User Update: ${newUser.tag}`)
        .setDescription(`<@${newUser.id}>\n\`${newUser.id}\``)
        .setThumbnail(newUser.displayAvatarURL({ extension: 'png', size: 2048 }))
        .setFields(
            { name: '🔹 Old Tag', value: `\`\`\`${oldUser.tag}\`\`\`` },
            { name: '🔹 New Tag', value: `\`\`\`${newUser.tag}\`\`\`` })
    ] })
}
