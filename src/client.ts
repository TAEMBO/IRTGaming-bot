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
    type PresenceData,
    userMention,
    codeBlock
} from "discord.js";
import { styleText } from "node:util";
import config from "#config" with { type: "json" };
import type { remindersTable } from "#db";
import { type Command, RepeatedMessages } from "#structures";
import { fs22Servers, fs25Servers } from "#util";
import type { CachedInvite, Config } from "#typings";

export default class TClient extends Client<true> {
    public readonly config = config as Config;
    public readonly fs22Cache = fs22Servers.cacheInit;
    public readonly fs25Cache = fs25Servers.cacheInit;
    public readonly ytCache = new Set<string>();
    public readonly chatInputCommands = new Collection<string, Command<"chatInput">>();
    public readonly contextMenuCommands = new Collection<string, Command<"message" | "user">>();
    public readonly repeatedMessages = new RepeatedMessages(this);
    public readonly inviteCache = new Collection<string, CachedInvite>();
    public readonly remindersCache = new Collection<typeof remindersTable.$inferSelect.id, typeof remindersTable.$inferSelect>();

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
            ?.replaceAll(" at ", styleText("red", " at "))
            .replaceAll(dirname, styleText("yellow", dirname))
            .slice(0, 2500);

        if (!channel) return;

        await channel.send({
            content: userMention(this.config.devWhitelist[0]),
            embeds: [new EmbedBuilder()
                .setTitle(error.message.slice(0, 255))
                .setColor("#420420")
                .setDescription(codeBlock("ansi", formattedErr!))
                .setTimestamp()
            ]
        }).catch(console.error);
    }
}