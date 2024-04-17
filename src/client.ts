import {
    ApplicationCommandOptionType,
    Client,
    Collection,
    EmbedBuilder,
    GatewayIntentBits,
    Options,
    Partials,
    type PresenceData,
    TextChannel
} from "discord.js";
import config from "./config.json" assert { type: "json" };
import * as Schemas from "./schemas/index.js";
import { LogColor } from "./util/index.js";
import { type Command, RepeatedMessages } from "./structures/index.js";
import type { CachedInvite, Config, FSCache, MCCache, YTCache } from "./typings.js";

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fsCache: FSCache = {};
    public readonly ytCache: YTCache = {};
    public readonly mcCache: MCCache = {};
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
    public readonly playerTimes = new Schemas.PlayerTimes(this);
    public readonly mcPlayerTimes = new Schemas.MCPlayerTimes();
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
                ...Options.DefaultMakeCacheSettings,
                BaseGuildEmojiManager: 0,
                GuildEmojiManager: 0,
                GuildMessageManager: 500,
            }),
            allowedMentions: { repliedUser: false, parse: ["users", "roles", "everyone"] }
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

    public async errorLog(error: Error) {
        console.error(error);
    
        if (["Request aborted", "getaddrinfo ENOTFOUND discord.com"].includes(error.message)) return;
    
        const dirname = process.cwd().replaceAll("\\", "/");
        const channel = this.getChan("taesTestingZone");
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