import {
    Client,
    GatewayIntentBits,
    Partials,
    Options,
    Collection,
    PresenceData,
    TextChannel,
    ApplicationCommandOptionType,
    Snowflake
} from "discord.js";
import { PlayerTimes, Punishments, Reminders, UserLevels, WatchList } from "./schemas.js";
import config from './config.json' assert { type: 'json' };
import { LocalDatabase, RepeatedMessages } from './utils.js';
import { Config, FSCache, YTCache, CachedInvite, ChatInputCommand, ContextMenuCommand } from './typings.js';

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fsCache: FSCache = {};
    public readonly ytCache: YTCache = {};
    public readonly chatInputCommands = new Collection<string, ChatInputCommand>();
    public readonly contextMenuCommands = new Collection<string, ContextMenuCommand>();
    public readonly repeatedMessages = new RepeatedMessages(this);
    public readonly inviteCache = new Collection<string, CachedInvite>();
    public readonly bannedWords = new LocalDatabase<string>('bannedWords.json');
    public readonly tfList = new LocalDatabase<string>('TFlist.json');
    public readonly fmList = new LocalDatabase<string>('FMlist.json');
    public readonly whitelist = new LocalDatabase<string>('adminWhitelist.json');
    public readonly watchListPings = new LocalDatabase<Snowflake>('watchListPings.json');
    public readonly dailyMsgs = new LocalDatabase<[number, number]>("dailyMsgs.json");
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

    public getChan(channelName: keyof typeof this.config.mainServer.channels) {
        const channel = this.channels.cache.get(this.config.mainServer.channels[channelName]);

        if (!(channel instanceof TextChannel)) throw new Error(`Config channel not of instance TextChannel: ${channelName}`);

        return channel;
    }

    public getRole(roleName: keyof typeof this.config.mainServer.roles) {
        const role = this.mainGuild().roles.cache.get(this.config.mainServer.roles[roleName]);

        if (!role) throw new Error(`Config role not found: ${roleName}`);

        return role;
    }

    public mainGuild() {
        const guild = this.guilds.cache.get(this.config.mainServer.id);

        if (!guild) throw new Error("Config guild not found");

        return guild;
    }

    public getCommandMention(name: string, subcommand?: string) {
        const cmd = this.application.commands.cache.find(x => x.name === name);

        if (!cmd) return null;

        const subCmd = cmd.options.find(x => x.type === ApplicationCommandOptionType.Subcommand && x.name === subcommand);

        if (subcommand && !subCmd) return null;

        return `</${cmd.name}${subcommand ? " " + subCmd?.name : ""}:${cmd.id}>` as const;
    }
}