import Discord from 'discord.js';
import YClient from '../client.js';
import { getChan } from '../utilities.js';

export default async (client: YClient, oldUser: Discord.User | Discord.PartialUser, newUser: Discord.User) => {
    if (!client.config.botSwitches.logs || oldUser.tag === newUser.tag) return;

    getChan(client, 'botLogs').send({ embeds: [new client.embed()
        .setTimestamp()
        .setColor(client.config.embedColor)
        .setTitle(`User Update: ${newUser.tag}`)
        .setDescription(`<@${newUser.id}>\n\`${newUser.id}\``)
        .setThumbnail(newUser.displayAvatarURL({ extension: 'png', size: 2048 }))
        .setFields(
            { name: '🔹 Old Tag', value: `\`\`\`${oldUser.tag}\`\`\`` },
            { name: '🔹 New Tag', value: `\`\`\`${newUser.tag}\`\`\`` })
    ] });
}
