import { Events } from "discord.js";
import { Event } from "#structures";
import { fsServers, log, tempReply } from "#util";

const privateServers = fsServers.getPrivateAll();

export default new Event({
    name: Events.MessageReactionAdd,
    async run(reaction, user) {
        let doBlockVote = false;
        const { communityIdeas } = user.client.config.mainServer.channels;
        const foundPrivateServer = privateServers.find(server => server[1].modSuggestions === reaction.message.channelId);

        if (reaction.message.channelId === communityIdeas && reaction.message.embeds[0]?.author?.name?.includes(user.id)) {
            doBlockVote = true;
        } else if (reaction.message.author?.id === user.id && foundPrivateServer) {
            const member = await user.client.mainGuild().members.fetch(user.id);

            if (!member.roles.cache.hasAny(...foundPrivateServer[1].managerRoles)) {
                doBlockVote = true;
            }
        }

        if (doBlockVote) {
            await reaction.users.remove(user.id);
            await tempReply(reaction.message, { content: `You cannot vote on your own suggestion, ${user}!`, timeout: 10_000 });

            log("magenta", `Blocked self-vote from ${user.tag} in ${reaction.message.channelId}`);
        }
    }
});