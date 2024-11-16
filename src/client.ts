import {
    AllowedMentionsTypes,
    ApplicationCommandOptionType,
    ChannelType,
    Client,
    Collection,
    EmbedBuilder,
    GatewayIntentBits,
    Options,
    Partials,
    type TextChannel,
    type PresenceData
} from "discord.js";
import config from "#config" with { type: "json" };
import * as Schemas from "#schemas";
import { fs22Servers, fs25Servers, LogColor } from "#util";
import { type Command, RepeatedMessages } from "#structures";
import type { CachedInvite, Config, FSCache, YTCache } from "#typings";

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fs22Cache: FSCache;
    public readonly fs25Cache: FSCache;
    public readonly ytCache: YTCache = {};
    public readonly chatInputCommands = new Collection<string, Command<"chatInput">>();
    public readonly contextMenuCommands = new Collection<string, Command<"message" | "user">>();
    public readonly repeatedMessages = new RepeatedMessages(this);
    public readonly inviteCache = new Collection<string, CachedInvite>();
    public readonly bannedWords = new Schemas.BannedWords();
    public readonly tfList = new Schemas.TFList();
    public readonly fmList = new Schemas.FMList();
    public readonly whitelist = new Schemas.Whitelist();
    public readonly watchListPings = new Schemas.WatchListPings();
    public readonly userLevels = new Schemas.UserLevels(this);
    public readonly punishments = new Schemas.Punishments(this);
    public readonly watchList = new Schemas.WatchList();
    public readonly playerTimes22 = new Schemas.PlayerTimes22(this);
    public readonly playerTimes25 = new Schemas.PlayerTimes25();
    public readonly reminders = new Schemas.Reminders(this);
    public readonly dailyMsgs = new Schemas.DailyMsgs();

    public constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ],
            partials: [
                Partials.Message,
                Partials.Reaction
            ],
            presence: config.botPresence as PresenceData,
            makeCache: Options.cacheWithLimits({
                GuildEmojiManager: 0,
                GuildMessageManager: 500,
                DMMessageManager: 0
            }),
            sweepers: {
                messages: {
                    interval: 10_800, // 3 hours
                    filter: () => msg => msg.author?.bot && msg.createdTimestamp < Date.now() - 900_000 // 15 minutes
                }
            },
            allowedMentions: {
                repliedUser: false,
                parse: [
                    AllowedMentionsTypes.User,
                    AllowedMentionsTypes.Role,
                    AllowedMentionsTypes.Everyone
                ]
            }
        });

        this.fs22Cache = Object.fromEntries(fs22Servers.keys().map(x => [x, {
            players: [],
            lastAdmin: null,
            graphPoints: [],
            completeRes: null,
            state: null,
            throttled: null,
        }]));

        this.fs25Cache = Object.fromEntries(fs25Servers.keys().map(x => [x, {
            players: [],
            lastAdmin: null,
            graphPoints: [],
            completeRes: null,
            state: null,
            throttled: null,
        }]));
    }

    public getChan(channelName: keyof typeof this.config.mainServer.channels) {
        const channel = this.channels.cache.get(this.config.mainServer.channels[channelName]);

        if (channel?.type !== ChannelType.GuildText) throw new Error(`Config channel not of instance TextChannel: ${channelName}`);

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

    public async errorLog(error: Error) {
        console.error(error);

        if (["Request aborted", "getaddrinfo ENOTFOUND discord.com"].includes(error.message)) return;

        const dirname = process.cwd().replaceAll("\\", "/");
        const channel = this.channels.cache.get(this.config.mainServer.channels.taesTestingZone) as TextChannel | undefined;
        const formattedErr = error.stack
            ?.replaceAll(" at ", ` ${LogColor.Red}at${LogColor.Reset} `)
            .replaceAll(dirname, LogColor.Yellow + dirname + LogColor.Reset)
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