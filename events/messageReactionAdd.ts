import Discord from 'discord.js';
import YClient from '../client.js';

export default async (client: YClient, messageReaction: Discord.MessageReaction, user: Discord.User) => {
    if (messageReaction.message?.embeds[0]?.author?.name?.includes(user.id) && messageReaction.message.channel.id === client.config.mainServer.channels.suggestions) {
        messageReaction.users.remove(user);
        messageReaction.message.reply(`You cannot vote on your own suggestion, <@${user.id}>!`).then(msg => setTimeout(() => msg.delete(), 10000));
    }
}