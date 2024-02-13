import type { Collection, PresenceData, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, Snowflake } from "discord.js";
import config from "./config.json" assert { type: "json" };
import type TClient from "./client.js";
import type { Command, LocalDatabase, RepeatedMessages } from "./utils.js";
import type {
    DailyMsgs,
    PlayerTimes,
    Punishments,
    Reminders,
    UserLevels,
    WatchList
} from "./schemas.js";

export type * from "./schemas.js";

declare module "discord.js" {
    interface Client {
        readonly config: Config;
        readonly fsCache: FSCache;
        readonly ytCache: YTCache;
        readonly chatInputCommands: Collection<string, Command<"chatInput">>;
        readonly contextMenuCommands: Collection<string, Command<"message" | "user">>;
        readonly repeatedMessages: RepeatedMessages;
        readonly inviteCache: Collection<string, CachedInvite>;
        readonly bannedWords: LocalDatabase<string>;
        readonly tfList: LocalDatabase<string>;
        readonly fmList: LocalDatabase<string>;
        readonly whitelist: LocalDatabase<string>;
        readonly watchListPings: LocalDatabase<Snowflake>;
        readonly userLevels: UserLevels;
        readonly punishments: Punishments;
        readonly watchList: WatchList;
        readonly playerTimes: PlayerTimes;
        readonly reminders: Reminders;
        readonly dailyMsgs: DailyMsgs;

        /**
         * Get a text channel via config
         * @param channelName
         */
        getChan(...args: Parameters<TClient["getChan"]>): ReturnType<TClient["getChan"]>;

        /**
         * Get a role via config
         * @param roleName
         */
        getRole(...args: Parameters<TClient["getRole"]>): ReturnType<TClient["getRole"]>;

        /**
         * Get the main guild this client is designed for
         */
        mainGuild(): ReturnType<TClient["mainGuild"]>;

        /**
         * Get the mention of a given slash command
         * @param name The name of the command
         * @param subcommand The optional subcommand to add
         */
        getCommandMention(...args: Parameters<TClient["getCommandMention"]>): ReturnType<TClient["getCommandMention"]>;
    }
}

export interface ApplicationRPC {
    bot_public: boolean;
    bot_require_code_grant: boolean;
    description: string;
    flags: number;
    hook: boolean;
    icon: string;
    id: string;
    name: string;
    summary: string;
    tags?: string[];
}

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & Record<string, any>;

export type Empty<T> = {
    [K in keyof T]: undefined;
}
export type RepeatedMessagesIdentifiers = "bw" | "adv" | "spam";

/** Adds cache implementation to this schema */
export interface Cached<TDocument> {
    cache: TDocument[];
    /**
     * @example
     * ```ts
     * public async fillCache() {
     *     this.cache = await this.data.find();
     * 
     *     return this;
     * }
     * ```
     */
    fillCache(): Promise<this>;
}

export interface RepeatedMessagesEntry {
    identifier: RepeatedMessagesIdentifiers;
    channel: string;
    msg: string;
}

export type RepeatedMessagesData = Record<string, {
    entries: Collection<number, RepeatedMessagesEntry>;
    timeout: NodeJS.Timeout;
}>;

export type CombinedSlashCommandBuilder = Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;

export type FSCache = Record<string, {
    players: FSLoopDSSPlayer[];
    status: "online" | "offline" | null;
    lastAdmin: number | null;
    graphPoints: number[];
}>;

export type YTCache = Record<string, string | null>;

export type Index = Record<string, () => any>;

export interface CachedInvite {
    uses: number;
    creator: string;
}

/** The base object data that is always present */
interface FSServerBase {
    /** The unabbreviated name of this server */
    readonly fullName: string;
    /** The channel ID for this server"s stats embed, used in FSLoop */
    readonly channelId: string;
    /** The message ID for this server"s stats embed, used in FSLoop */
    readonly messageId: string;
    /** The username to login to the server"s panel */
    readonly username: string;
    /** The password to login to the server"s panel */
    readonly password: string;
    /** The address to access the server"s API & webserver panel (e.g. `192.168.0.1:8080` or `example.com`) */
    readonly address: string;
    /** The API code to gain access to the API for the server (e.g. `a1b2c3d4e5f6g7h8i9`) */
    readonly code: string;
    /** Whether or not this server is a private server with a password */
    readonly isPrivate: boolean;
    /** The FTP details for this server */
    readonly ftp: {
        readonly host: string;
        readonly user: string;
        readonly password: string;
        /** The path to navigate to the game"s profile folder */
        readonly path: string;
    };
}

/** Object data for a public server */
export interface FSServerPublic extends FSServerBase {
    readonly isPrivate: false;
    /** The time zone difference between this server"s location and UTC in minutes */
    readonly utcDiff: number;
    /** An array of activities that can be done on this server */
    readonly todo: string[];
}

/** Object data for a private server */
export interface FSServerPrivate extends FSServerBase {
    readonly isPrivate: true;
}

export type FSServer = FSServerPrivate | FSServerPublic;

/** Structure of config.json */
export interface Config {
    /** The Discord bot client token */
    readonly TOKEN: string;
    /** The URI for connecting to a MongoDB server */
    readonly MONGO_URI: string;
    readonly USER_AGENT_HEADER: string;
    readonly EMBED_COLOR: `#${string}`;
    readonly EMBED_COLOR_GREEN: `#${string}`;
    readonly EMBED_COLOR_RED: `#${string}`;
    readonly EMBED_COLOR_YELLOW: `#${string}`;
    readonly PLAYERTIMES_START_DATE: string;
    /** Unix timestamp used for calculating when each day for daily msgs loop to be called */
    readonly DAILY_MSGS_TIMESTAMP: number;
    readonly DAILY_MSGS_DEFAULT: `<${"a" | ""}:${string}:${string}>`;
    readonly DAILY_MSGS_MONDAY: `<${"a" | ""}:${string}:${string}>`;
    readonly DAILY_MSGS_WEEKEND: `<${"a" | ""}:${string}:${string}>`;
    botPresence: PresenceData;
    toggles: {
        commands: boolean;
        automod: boolean;
        logs: boolean;
        registerCommands: boolean;
        fsLoop: boolean;
        ytLoop: boolean;
        autoResponses: boolean;
        buttonRoles: boolean;
    };
    /** An object for managing and communicating with Farming Simulator servers, keyed by their abbreviated acronym */
    fs: Record<string, FSServer>;
    /** A list of user IDs that are considered developers of this bot */
    devWhitelist: Snowflake[];
    whitelist: {
        /** A list of channel IDs that automod does not apply to */
        bannedWords: Snowflake[];
        /** A list of channel IDs that logs do not emit for */
        logs: Snowflake[];
    };
    ytChannels: {
        id: string,
        name: string
    }[];
    resources: Record<keyof typeof config.resources, `https://${string}`>;
    mainServer: {
        /** The ID of the guild that this bot is for */
        id: Snowflake;
        fsLoopMsgId: Snowflake;
        mfFarmRoles: Array<keyof Config["mainServer"]["roles"]>;
        mpStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        dcStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        roles: Record<keyof typeof config.mainServer.roles, Snowflake>;
        channels: Record<keyof typeof config.mainServer.channels, Snowflake>;
        categories: Record<keyof typeof config.mainServer.categories, Snowflake>;
    };
}

export type MFFarmRoleKeys = Config["mainServer"]["mfFarmRoles"][number];

interface FSLoopDSSPlayerCoordinates {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export type FSLoopDSSPlayer = {
    readonly isUsed: boolean;
    readonly isAdmin: boolean;
    readonly uptime: number;
    readonly name: string;
} & (Empty<FSLoopDSSPlayerCoordinates> | FSLoopDSSPlayerCoordinates);

interface FSLoopDSSServer {
    readonly dayTime: number;
    readonly game: string;
    readonly mapName: string;
    readonly mapSize: number;
    readonly mapOverviewFilename: string;
    readonly money: number;
    readonly name: string;
    readonly server: string;
    readonly version: string;
}

interface FSLoopDSSSlots {
    readonly capacity: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
    readonly used: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
    readonly players: FSLoopDSSPlayer[];
}

interface FSLoopDSSVehicle {
    readonly name: string;
    readonly category: string;
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly fills: {
        readonly type: string;
        readonly level: number;
    }[];
}

interface FSLoopDSSMod {
    readonly author: string;
    readonly hash: string;
    readonly name: string;
    readonly version: string;
    readonly description: string;
}

interface FSLoopDSSField {
    readonly id: number;
    readonly isOwned: boolean;
    readonly x: number;
    readonly z: number;
}

interface FSLoopDSSObject {
    readonly server: FSLoopDSSServer;
    readonly slots: FSLoopDSSSlots;
    readonly vehicles: FSLoopDSSVehicle[];
    readonly mods: FSLoopDSSMod[];
    readonly fields: FSLoopDSSField[];
}

export type FSLoopDSS = FSLoopDSSObject | Empty<FSLoopDSSObject>;

export interface FSLoopCSG {
    readonly careerSavegame: {
        readonly settings?: {
            readonly savegameName: { readonly _text: string; };
            readonly creationDate: { readonly _text: string; };
            readonly mapId: { readonly _text: string; };
            readonly mapTitle: { readonly _text: string; };
            readonly saveDateFormatted: { readonly _text: string; };
            readonly saveDate: { readonly _text: string; };
            readonly resetVehicles: { readonly _text: "true" | "false"; };
            readonly trafficEnabled: { readonly _text: "true" | "false"; };
            readonly stopAndGoBraking: { readonly _text: "true" | "false"; };
            readonly trailerFillLimit: { readonly _text: "true" | "false"; };
            readonly automaticMotorStartEnabled: { readonly _text: "true" | "false"; };
            readonly growthMode: { readonly _text: "1" | "2" | "3"; };
            readonly fixedSeasonalVisuals: { readonly _text: string; };
            readonly plannedDaysPerPeriod: { readonly _text: string; };
            readonly fruitDestruction: { readonly _text: "true" | "fase"; };
            readonly plowingRequiredEnabled: { readonly _text: "true" | "fase"; };
            readonly stonesEnabled: { readonly _text: "true" | "false"; };
            readonly weedsEnabled: { readonly _text: "true" | "false"; };
            readonly limeRequired: { readonly _text: "true" | "false"; };
            readonly isSnowEnabled: { readonly _text: "true" | "false"; };
            readonly fuelUsage: { readonly _text: string; };
            readonly helperBuyFuel: { readonly _text: "true" | "false"; };
            readonly helperBuySeeds: { readonly _text: "true" | "false"; };
            readonly helperBuyFertilizer: { readonly _text: "true" | "false"; };
            readonly helperSlurrySource: { readonly _text: string; };
            readonly helperManureSource: { readonly _text: string; };
            readonly densityMapRevision: { readonly _text: string; };
            readonly terrainTextureRevision: { readonly _text: string; };
            readonly terrainLodTextureRevision: { readonly _text: string; };
            readonly splitShapesRevision: { readonly _text: string; };
            readonly tipCollisionRevision: { readonly _text: string; };
            readonly placementCollisionRevision: { readonly _text: string; };
            readonly navigationCollisionRevision: { readonly _text: string; };
            readonly mapDensityMapRevision: { readonly _text: string; };
            readonly mapTerrainTextureRevision: { readonly _text: string; };
            readonly mapTerrainLodTextureRevision: { readonly _text: string; };
            readonly mapSplitShapesRevision: { readonly _text: string; };
            readonly mapTipCollisionRevision: { readonly _text: string; };
            readonly mapPlacementCollisionRevision: { readonly _text: string; };
            readonly mapNavigationCollisionRevision: { readonly _text: string; };
            readonly difficulty: { readonly _text: string; };
            readonly economicDifficulty: { readonly _text: string; };
            readonly dirtInterval: { readonly _text: string; };
            readonly timeScale: { readonly _text: string; };
            readonly autoSaveInterval: { readonly _text: string; };
        };
        readonly statistics: {
            readonly money: { readonly _text: string; };
            readonly playTime: { readonly _text: string; };
        };
        readonly slotSystem: {
            readonly _attributes: {
                readonly slotUsage: string;
            };
        };
    }
}

interface YTCacheFeedEntry {
    readonly id: { readonly _text: string; };
    readonly "yt:videoId": { readonly _text: string; };
    readonly "yt:channelId": { readonly _text: string; };
    readonly title: { readonly _text: string; };
    readonly link: {
        readonly _attributes: {
            readonly rel: string;
            readonly href: string;
        };
    };
    readonly author: {
        readonly name: { readonly _text: string; };
        readonly uri: { readonly _text: string; };
    };
    readonly published: { readonly _text: string; };
    readonly updated: { readonly _text: string; };
    readonly "media:group": {
        readonly "media:title": { readonly _text: string; };
        readonly "media:content": {
            readonly _attributes: {
                readonly url: string;
                readonly type: string;
                readonly width: string;
                readonly height: string;
            };
        };
        readonly "media:thumbnail": {
            readonly _attributes: {
                readonly url: string;
                readonly width: string;
                readonly height: string;
            };
        };
        readonly "media:description": { readonly _text: string; };
        readonly "media:community": {
            readonly "media:starRating": {
                readonly _attributes: {
                    readonly count: string;
                    readonly average: string;
                    readonly min: string;
                    readonly max: string;
                };
            };
            readonly "media:statistics": {
                readonly _attributes: { readonly views: string; };
            };
        };
    };
}

export interface YTCacheFeed {
    readonly feed: {
        readonly _attributes: {
            readonly "xmlns:yt": string;
            readonly "xmlns:media": string;
            readonly xmlns: string;
        };
        readonly link: {
            readonly _attributes: {
                readonly rel: string;
                readonly href: string;
            };
        }[];
        readonly id: { readonly _text: string; };
        readonly title: { readonly _text: string; };
        readonly author: {
            readonly name: { readonly _text: string; };
            readonly uri: { readonly _text: string; };
        };
        readonly published: { readonly _text: string; };
        readonly entry: YTCacheFeedEntry[];
    };
}

export interface BanFormat {
    readonly blockedUserIds: {
        readonly user: {
            readonly _attributes: {
                readonly uniqueUserId: string;
                readonly platformUserId: string;
                readonly platformId: string;
                readonly displayName: string;
            };
        }[];
    };
}

export interface FarmFormat {
    readonly _declaration: {
        readonly _attributes: {
            readonly version: string;
            readonly encoding: string;
            readonly standalone: string;
        };
    };
    readonly farms: {
        readonly farm: [
            GreenFarm,
            StaffFarm,
            StaffFarm
        ];
    };
}

interface GreenFarm {
    readonly _attributes: {
        readonly farmId: "1" | "2" | "3" | "4" | "5" | "6";
        readonly name: string;
        readonly color: string;
        readonly loan: string;
        readonly money: string;
    };
    readonly players: {
        readonly player: FarmPlayer[];
    };
}
interface StaffFarm {
    readonly _attributes: Prettify<GreenFarm["_attributes"] & { readonly password: string; }>;
    readonly players?: {
        readonly player: FarmPlayer[] | FarmPlayer;
    };
}

interface FarmPlayer {
    readonly _attributes: {
        readonly uniqueUserId: string;
        readonly farmManager: "true" | "false";
        readonly lastNickname: string;
        readonly timeLastConnected: string;
        readonly buyVehicle: "true" | "false";
        readonly sellVehicle: "true" | "false";
        readonly buyPlaceable: "true" | "false";
        readonly sellPlaceable: "true" | "false";
        readonly manageContracts: "true" | "false";
        readonly radeAnimals: "true" | "false";
        readonly createFields: "true" | "false";
        readonly landscaping: "true" | "false";
        readonly hireAssistant: "true" | "false";
        readonly resetVehicle: "true" | "false";
        readonly manageProductions: "true" | "false";
        readonly cutTrees: "true" | "false";
        readonly manageRights: "true" | "false";
        readonly transferMoney: "true" | "false";
        readonly updateFarm: "true" | "false";
        readonly manageContracting: "true" | "false";
    };
}

export interface DedicatedServerConfig {
    readonly gameserver: {
        readonly settings: {
            readonly game_name: { readonly _text: string; };
            readonly admin_password: { readonly _text?: string; };
            readonly game_password: { readonly _text?: string; };
            readonly savegame_index: { readonly _text: "1" | "2" | "3"| "4"| "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "18" | "19" | "20"; };
            readonly max_player: { readonly _text: "2" | "3"| "4"| "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16"; };
            readonly port: { readonly _text: string; };
            readonly language: { readonly _text: "en" | "de" | "jp" | "pl" | "cz" | "fr" | "es" | "ru" | "it" | "pt" | "hu" | "nl" | "cs" | "ct" | "br" | "tr" | "ro" | "kr" | "da" | "fi" | "no" | "sv"; };
            readonly auto_save_interval: { readonly _text: `${string}.000000`; };
            readonly stats_interval: { readonly _text: `${string}.000000`; };
            readonly use_upnp: { readonly _text: "true" | "false"; };
            readonly crossplay_allowed: { readonly _text: "true" | "false"; };
            readonly difficulty: { readonly _text: "2" | "3"; };
            readonly pause_game_if_empty: { readonly _text: "1" | "2"; };
            readonly mapID: { readonly _text: string; };
            readonly mapFilename: { readonly _text: string; };
        };
    };
}