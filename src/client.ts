import {
    Client,
    GatewayIntentBits,
    Partials,
    Options,
    Collection,
    PresenceData,
    TextChannel,
    Role,
    Guild,
    ApplicationCommandOptionType,
    EmbedBuilder
} from "discord.js";
import { PlayerTimes, Punishments, Reminders, UserLevels, WatchList } from "./schemas.js";
import config from './config.json' assert { type: 'json' };
import { LocalDatabase, RepeatedMessages } from './utilities.js';
import { Config, FSCache, YTCache, CachedInvite, Command } from './typings.js';

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fsCache: FSCache = {};
    public readonly ytCache: YTCache = {};
    public readonly commands = new Collection<string, Command>();
    public readonly repeatedMessages = new RepeatedMessages(this);
    public readonly inviteCache = new Collection<string, CachedInvite>();
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

    public getCommandMention(name: string, subcommand?: string) {
        const cmd = this.mainGuild().commands.cache.find(x => x.name === name);

        if (!cmd) return null;

        const subCmd = cmd.options.find(x => x.type === ApplicationCommandOptionType.Subcommand && x.name === subcommand);

        if (subcommand && !subCmd) return null;

        return `</${cmd.name}${subcommand ? "" : " " + subCmd?.name}:${cmd.id}>` as const;
    }

    public async errorLog(error: Error) {
        console.error(error);
    
        if (['Request aborted', 'getaddrinfo ENOTFOUND discord.com'].includes(error.message)) return;
    
        const dirname = process.cwd().replaceAll('\\', '/');
        const channel = this.getChan('taesTestingZone');
        const formattedErr = error.stack
            ?.replaceAll(' at ', ' [31mat[37m ')
            .replaceAll(dirname, `[33m${dirname}[37m`)
            .slice(0, 2500);
    
        if (!channel) return;
    
        await channel.send({
            content: `<@${this.config.devWhitelist[0]}>`,
            embeds: [new EmbedBuilder()
                .setTitle(`Error Caught - ${error.message.slice(0, 240)}`)
                .setColor("#420420")
                .setDescription(`\`\`\`ansi\n${formattedErr}\`\`\``)
                .setTimestamp()
            ]
        });
    }
}