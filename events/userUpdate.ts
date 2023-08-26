import Discord, { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';
import { formatUser } from '../utilities.js';

export default async (client: YClient, oldUser: Discord.User | Discord.PartialUser, newUser: Discord.User) => {
    if (!client.config.botSwitches.logs || oldUser.tag === newUser.tag) return;

    client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTimestamp()
        .setColor(client.config.embedColor)
        .setTitle(`User Update: ${newUser.tag}`)
        .setDescription(formatUser(newUser))
        .setThumbnail(newUser.displayAvatarURL({ extension: 'png', size: 2048 }))
        .setFields(
            { name: '🔹 Old Tag', value: `\`\`\`${oldUser.tag}\`\`\`` },
            { name: '🔹 New Tag', value: `\`\`\`${newUser.tag}\`\`\`` })
    ] });
}
