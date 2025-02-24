import { Events } from "discord.js";
import { Event } from "#structures";
import { fs22Servers, fs25Servers, isDCStaff, tempReply } from "#util";

function dayReaction() {
    const date = new Date();

    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

    if (date.getDay() === 5) {
        return "It's Friday!!!";
    } else if (date.getDay() === 4) {
        return "It's almost Friday...";
    } else {
        return "";
    }
};

function randomEl(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const morningPrefixes = ["morning all", "morning everyone", "morning guys", "morning people"];
const mornRes1 = [
    "Wakey wakey",
    "Morning",
    "Good morning",
    "Rise and shine",
    "Up and at 'em",
    "Howdy",
    "Top of the mornin' to ya",
    "Glad to see you up",
    "What's up"
];
const mornRes2 = [
    dayReaction(),
    "Here, take a pancake or two 🥞",
    "Here, take a 🥔",
    "Here, take a cookie 🍪",
    "Fancy a piece of pizza? Here you go 🍕",
    "I have no movie, but I have some popcorn! Here you go 🍿",
    "It's a bit stale but enjoy 🍞",
    "Don't fall out of bed!",
    "Coffee's gonna be a little late this morning",
    "Tea's gonna be a little late this morning",
    "Did you have a good dream?",
    "<a:IRT_DogWave:716263418495238215>",
    "<:IRT_GoodMorning:605524803008593920>",
    "I hope you have a good day today sweetie!",
    "Here's some wheat to make some bread that's not stale <:IRT_Wheat:761356327708131329>",
    "I have a movie this time! Sync Sim 22, a real good one.",
    "Did you sleep on the cold side of the pillow?",
    "I have a sausage roll for you! <:IRT_Sausageroll:666726520701845534>",
    "I spilled the tea... the floor smells like tea now",
    "I spilled the coffee... the floor is lava now",
    "So, we're uh, we're out of tea...",
    "So, we're uh, we're out of coffee...",
    "I got some *fresh* bread this time! 🍞",
    "I got some *fresh* bread this time! You can have the older stuff though 🍞",
    "We're out of breakfast ingredients, looks like no breakfast",
    "Please be sure to put on matching socks!",
    "Apple for you 🍎"
];
const privateServers = [...fs22Servers.getPrivateAll(), ...fs25Servers.getPrivateAll()];

export default new Event({
    name: Events.MessageCreate,
    async run(message) {
        if (
            (
                !message.client.config.toggles.commands
                && !message.client.config.devWhitelist.includes(message.author.id)
            )
            || message.system
            || message.author.bot
            || !message.inGuild()
        ) return;
        // Bot is set to ignore commands and non-dev sent a message, ignore the message

        const msg = message.content.replaceAll("\n", " ").toLowerCase();
        let automodded = false;

        // RepeatedMessages
        const isWhitelisted = message.client.config.whitelist.bannedWords.some(x => [message.channelId, message.channel.parentId].includes(x));

        if (message.client.config.toggles.automod && !isDCStaff(message.member) && !isWhitelisted) {
            automodded = await message.client.repeatedMessages.triageMessage(message);
        }

        // Community idea message management
        if (
            message.channelId === message.client.config.mainServer.channels.communityIdeas
            && message.author.id !== message.client.user.id
            && !isDCStaff(message.member)
        ) {
            automodded = true;

            await tempReply(message, {
                timeout: 10_000,
                content: `You can only post community ideas in this channel using the ${message.client.getCommandMention("suggest")} command!`
            });
            await message.delete();
        }

        if (automodded) return;

        if (message.channelId !== message.client.config.mainServer.channels.spamZone) {
            await message.client.userLevels.incrementUser(message.author.id);
        }

        if (!message.client.config.toggles.autoResponses) return;

        // MF mod voting
        if (
            privateServers.some(x => x[1].modSuggestions === message.channelId)
            && message.content.includes("http")
        ) {
            await message.react("764965325342244915");
            await message.react("764965659423408148");
        }

        // Morning message system
        if (message.channelId === message.client.config.mainServer.channels.general && morningPrefixes.some(x => msg.includes(x))) {
            const staffTag = (message.member!.displayName.indexOf(" | ") ?? NaN) < 0
                ? undefined
                : message.member!.displayName.indexOf(" | ");
            const displayName = message.member!.displayName.slice(0, staffTag).replace("[LOA] ", "");

            await message.reply(`${randomEl(mornRes1)} ${displayName}! ${randomEl(mornRes2)}`);
        }
    }
});