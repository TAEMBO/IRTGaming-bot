import { Events } from "discord.js";
import { Event } from "#structures";
import { fsServers, log, tempReply } from "#util";

export default new Event({
    name: Events.MessageReactionAdd,
    async run(reaction, user) {
        if (
            (
                reaction.message.embeds[0]?.author?.name?.includes(user.id)
                && reaction.message.channelId === user.client.config.mainServer.channels.communityIdeas
            )
            || (
                reaction.message.author?.id === user.id
                && fsServers.getPrivateAll().some(x => x[1].modSuggestions === reaction.message.channelId)
            )
        ) {
            await reaction.users.remove(user.id);
            await tempReply(reaction.message, { content: `You cannot vote on your own suggestion, ${user}!`, timeout: 10_000 });

            log("Purple", `Blocked self-vote from ${user.tag} in ${reaction.message.channelId}`);
        }
    }
});