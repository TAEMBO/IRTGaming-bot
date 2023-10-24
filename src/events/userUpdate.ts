import { EmbedBuilder, User, PartialUser } from 'discord.js';
import { formatUser } from '../utilities.js';

export default async (oldUser: User | PartialUser, newUser: User) => {
    if (!newUser.client.config.botSwitches.logs || oldUser.tag === newUser.tag) return;

    await newUser.client.getChan('botLogs').send({ embeds: [new EmbedBuilder()
        .setTimestamp()
        .setColor(newUser.client.config.embedColor)
        .setTitle(`User Update: ${newUser.tag}`)
        .setDescription(formatUser(newUser))
        .setThumbnail(newUser.displayAvatarURL({ extension: 'png', size: 2048 }))
        .setFields(
            { name: '🔹 Old Tag', value: `\`\`\`${oldUser.tag}\`\`\`` },
            { name: '🔹 New Tag', value: `\`\`\`${newUser.tag}\`\`\`` })
    ] });
}