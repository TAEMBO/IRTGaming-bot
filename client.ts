import Discord, { Client, GatewayIntentBits, Partials } from "discord.js";
import UserLevels from './schemas/userLevels.js';
import Punishments from './schemas/punishments.js';
import PlayerTimes from './schemas/playerTimes.js';
import WatchList from './schemas/watchList.js';
import Reminders from './schemas/reminders.js';
import config from './config.json' assert { type: 'json' };
import { LocalDatabase, RepeatedMessages } from './utilities.js';
import { Config, FSCache, YTCache, InviteCache, Command, Registry } from './typings.js';

export default class YClient extends Client<true> {
    public readonly config = config as Config;
    public readonly registry: Registry = [];
    public readonly fsCache: FSCache = {};
    public readonly ytCache: YTCache = {};
    public readonly commands = new Discord.Collection<string, Command>();
    public readonly repeatedMessages = new RepeatedMessages(this);
    public readonly invites = new Map<string, InviteCache>();
    public readonly bannedWords = new LocalDatabase<string>('bannedWords');
    public readonly tfList = new LocalDatabase<string>('TFlist');
    public readonly fmList = new LocalDatabase<string>('FMlist');
    public readonly whitelist = new LocalDatabase<string>('adminWhitelist');
    public readonly watchListPings = new LocalDatabase<string>('watchListPings');
    public readonly userLevels = new UserLevels(this);
    public readonly punishments = new Punishments(this);
    public readonly watchList = new WatchList();
    public readonly playerTimes = new PlayerTimes(this);
    public readonly reminders = new Reminders(this);

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.Reaction
            ],
            presence: config.botPresence as Discord.PresenceData
        });
    }

    /**
     * Get a text channel via config
     * @param channel
     */
    public getChan(channel: keyof typeof this.config.mainServer.channels) {
        return this.channels.cache.get(this.config.mainServer.channels[channel]) as Discord.TextChannel;
    }

    /**
     * Get a role via config
     * @param role
     */
    public getRole(role: keyof typeof this.config.mainServer.roles) {
        return this.mainGuild().roles.cache.get(this.config.mainServer.roles[role]) as Discord.Role;
    }

    /**
     * Get the main guild this client is designed for
     */
    public mainGuild() {
        return this.guilds.cache.get(this.config.mainServer.id) as Discord.Guild;
    }
}