import { Collection, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction, PresenceData } from 'discord.js';
import config from './config.json' assert { type: 'json' };

export * from './schemas/playerTimes.js';
export * from './schemas/punishments.js';
export * from './schemas/reminders.js';
export * from './schemas/userLevels.js';
export * from './schemas/watchList.js';

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
} & {};

export type Empty<T> = {
    [K in keyof T]: undefined;
}
export type RepeatedMessagesIdentifiers = 'bw' | 'adv' | 'spam';

export interface RepeatedMessagesEntry {
    identifier: RepeatedMessagesIdentifiers;
    channel: string;
    msg: string;
}

export type RepeatedMessagesData = Record<string, {
    entries: Collection<number, RepeatedMessagesEntry>;
    timeout: NodeJS.Timeout;
}>;

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

export interface Command {
    run(interaction: ChatInputCommandInteraction<"cached">): Promise<any>;
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;
    uses: number;
}

/** `Discord.ChatInputCommandInteraction<CacheType>` */
export interface TInteraction extends ChatInputCommandInteraction<"cached"> {
    channel: NonNullable<ChatInputCommandInteraction<"cached">["channel"]>;
}


/** The base object data that is always present */
export interface FSServerBase {
    /** The unabbreviated name of this server */
    readonly fullName: string;
    /** The channel ID for this server's stats embed, used in FSLoop */
    readonly channelId: string;
    /** The message ID for this server's stats embed, used in FSLoop */
    readonly messageId: string;
    /** The dedicated server panel login for this server */
    readonly login: string;
    /** The Link XML URL for this server (w/ .json extension) */
    readonly dss: string;
    /** The Link Savegame File (careerSavegame) URL */
    readonly csg: string;
    /** Whether or not this server is a private server with a password */
    readonly isPrivate: boolean;
}

/** Object data for a public server */
export interface FSServerPublic extends FSServerBase {
    readonly isPrivate: false;
    /** The time zone difference between this server's location and UTC in minutes */
    readonly utcDiff: number;
    /** An array of activities that can be done on this server */
    readonly todo: string[];
    /** The FTP details for this server */
    readonly ftp: {
        readonly host: string;
        readonly user: string;
        readonly password: string;
        /** The path to navigate to the game's profile folder */
        readonly path: string;
    };
}

/** Object data for a private server */
export interface FSServerPrivate extends FSServerBase {
    readonly isPrivate: true;
}

export type FSServer = FSServerPrivate | FSServerPublic;

/** Structure of config.json */
export interface Config {
    /** The Discord bot client token */
    readonly token: string;
    /** The URL for connecting to a MongoDB server */
    readonly mongoURL: string;
    readonly userAgentHeader: string;
    readonly embedColor: `#${string}`;
    readonly embedColorGreen: `#${string}`;
    readonly embedColorRed: `#${string}`;
    readonly embedColorYellow: `#${string}`;
    readonly botPresence: PresenceData;
    readonly botSwitches: {
        readonly commands: boolean;
        readonly automod: boolean;
        readonly logs: boolean;
        readonly registerCommands: boolean;
        readonly fsLoop: boolean;
        readonly ytLoop: boolean;
        readonly autoResponses: boolean;
        readonly buttonRoles: boolean;
    };
    /** An object for managing and communicating with Farming Simulator servers, keyed by their abbreviated acronym */
    readonly fs: Record<string, FSServer>;
    /** A list of user IDs that are considered developers of this bot */
    readonly devWhitelist: Array<string>;
    readonly whitelist: {
        /** A list of channel IDs that automod does not apply to */
        readonly bannedWords: string[];
        /** A list of channel IDs that logs do not emit for */
        readonly logs: string[];
    };
    /** `Array<[ChannelID, ChannelName]>` */
    readonly ytCacheChannels: string[][];
    readonly mainServer: {
        /** The ID of the guild that this bot is for */
        readonly id: string;
        readonly fsLoopMsgId: string;
        readonly mfFarmRoles: Array<keyof Config["mainServer"]["roles"]>;
        readonly mpStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        readonly dcStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        readonly roles: Record<keyof typeof config.mainServer.roles, string>;
        readonly channels: Record<keyof typeof config.mainServer.channels, string>;
        readonly categories: Record<keyof typeof config.mainServer.categories, string>;
    };
}

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
    readonly capacity: number;
    readonly used: number;
    readonly players: FSLoopDSSPlayer[];
}

interface FSLoopDSSObject {
    readonly server: FSLoopDSSServer;
    readonly slots: FSLoopDSSSlots;
}

export type FSLoopDSS = FSLoopDSSObject | Empty<FSLoopDSSObject>;

export interface FSLoopDSSPlayer {
    readonly isUsed: boolean;
    readonly isAdmin: boolean;
    readonly uptime: number;
    readonly name: string;
}

export interface FSLoopCSG {
    readonly careerSavegame: {
        readonly settings?: {
            readonly savegameName: { readonly _text: string; };
            readonly creationDate: { readonly _text: string; },
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

export interface banFormat {
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

export interface farmFormat {
    readonly _declaration: {
        readonly _attributes: {
            readonly version: string;
            readonly encoding: string;
            readonly standalone: string;
        };
    };
    readonly farms: {
        readonly farm: [
            greenFarm,
            staffFarm,
            staffFarm
        ];
    };
}

interface greenFarm {
    readonly _attributes: {
        readonly farmId: "1" | "2" | "3" | "4" | "5" | "6";
        readonly name: string;
        readonly color: string;
        readonly loan: string;
        readonly money: string;
    };
    readonly players: {
        readonly player: farmPlayer[];
    };
}
interface staffFarm {
    readonly _attributes: greenFarm["_attributes"] & { readonly password: string; };
    readonly players?: {
        readonly player: farmPlayer[] | farmPlayer;
    };
}

interface farmPlayer {
    readonly _attributes: {
        readonly uniqueUserId: string;
        readonly farmManager: "false" | "true";
        readonly lastNickname: string;
        readonly timeLastConnected: string;
        readonly buyVehicle: "false" | "true";
        readonly sellVehicle: "false" | "true";
        readonly buyPlaceable: "false" | "true";
        readonly sellPlaceable: "false" | "true";
        readonly manageContracts: "false" | "true";
        readonly radeAnimals: "false" | "true";
        readonly createFields: "false" | "true";
        readonly landscaping: "false" | "true";
        readonly hireAssistant: "false" | "true";
        readonly resetVehicle: "false" | "true";
        readonly manageProductions: "false" | "true";
        readonly cutTrees: "false" | "true";
        readonly manageRights: "false" | "true";
        readonly transferMoney: "false" | "true";
        readonly updateFarm: "false" | "true";
        readonly manageContracting: "false" | "true";
    };
}