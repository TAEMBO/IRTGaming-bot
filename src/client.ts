import { Client, GatewayIntentBits, Partials, Options, Collection, PresenceData, TextChannel, Role, Guild } from "discord.js";
import UserLevels from './schemas/userLevels.js';
import Punishments from './schemas/punishments.js';
import PlayerTimes from './schemas/playerTimes.js';
import WatchList from './schemas/watchList.js';
import Reminders from './schemas/reminders.js';
import config from './config.json' assert { type: 'json' };
import { LocalDatabase, RepeatedMessages } from './utilities.js';
import { Config, FSCache, YTCache, InviteCache, Command } from './typings.js';

declare module "discord.js" {
    interface Client {
        readonly config: Config;
        readonly fsCache: FSCache;
        readonly ytCache: YTCache;
        readonly commands: Collection<string, Command>;
        readonly repeatedMessages: RepeatedMessages;
        readonly invites: Map<string, InviteCache>;
        readonly bannedWords: LocalDatabase<string>;
        readonly tfList: LocalDatabase<string>;
        readonly fmList: LocalDatabase<string>;
        readonly whitelist: LocalDatabase<string>;
        readonly watchListPings: LocalDatabase<string>;
        readonly userLevels: UserLevels;
        readonly punishments: Punishments;
        readonly watchList: WatchList;
        readonly playerTimes: PlayerTimes;
        readonly reminders: Reminders;
        /**
         * Get a text channel via config
         * @param channel
         */
        getChan(channel: keyof Config["mainServer"]["channels"]): TextChannel;
        /**
         * Get a role via config
         * @param role 
         */
        getRole(role: keyof Config["mainServer"]["roles"]): Role;
        /**
         * Get the main guild this client is designed for
         */
        mainGuild(): Guild;
    }
}

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fsCache: FSCache = {};
    public readonly ytCache: YTCache = {};
    public readonly commands = new Collection<string, Command>();
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
            presence: config.botPresence as PresenceData,
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                GuildMessageManager: 500
            })
        });
    }

    public getChan(channel: keyof typeof this.config.mainServer.channels) {
        return this.channels.cache.get(this.config.mainServer.channels[channel]) as TextChannel;
    }

    public getRole(role: keyof typeof this.config.mainServer.roles) {
        return this.mainGuild().roles.cache.get(this.config.mainServer.roles[role]) as Role;
    }

    public mainGuild() {
        return this.guilds.cache.get(this.config.mainServer.id) as Guild;
    }
}