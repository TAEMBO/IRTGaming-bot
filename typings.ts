import YClient from './client.js';
import { GuildMember, Message, Collection, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction, PresenceData, GuildTextBasedChannel } from 'discord.js';
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
};

export type GuildMemberIntOrMsg = GuildMember | TInteraction | Message;

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type RepeatedMessagesData = Record<string, {
    data: Collection<number, {
        type: string;
        channel: string;
    }>;
    timeout: NodeJS.Timeout;
}>;

export type FSCache = Record<string, {
    players: FSLoopDSSPlayer[];
    status: "online" | "offline" | null;
    lastAdmin: number | null;
}>;

export type YTCache = Record<string, string | null>;

export type Index = Record<string, () => any>;

export interface InviteCache {
    uses: number | null;
    creator?: string;
}

export interface Command {
    run(interaction: ChatInputCommandInteraction<"cached">): Promise<any>;
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;
    uses: number;
}

/** `Discord.ChatInputCommandInteraction<CacheType>` */
export interface TInteraction extends ChatInputCommandInteraction<"cached"> {
    readonly client: YClient;
    channel: NonNullable<GuildTextBasedChannel>;
};

/** Append custom client property to a class instance */
export type TClient<T> = T & {
    readonly client: YClient;
};

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
}
/** Additional object data if this server is public */
export interface FSServerPublic {
    /** Whether or not this server is a private server with a password */
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
/** Additional object data if this server is private */
export interface FSServerPrivate {
    /** Whether or not this server is a private server with a password */
    readonly isPrivate: true;
}
export type FSServer = FSServerBase & (FSServerPrivate | FSServerPublic);

/** Template for creating a config.json */
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
    statsGraphSize: number;
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

export interface FSLoopDSS {
    readonly server: {
        readonly dayTime: number;
        readonly game: string;
        readonly mapName: string;
        readonly mapSize: number;
        readonly mapOverviewFilename: string;
        readonly money: number;
        readonly name: string;
        readonly server: string;
        readonly version: string;
    };
    readonly slots: {
        readonly capacity: number;
        readonly used: number;
        readonly players: FSLoopDSSPlayer[];
    };
}

export interface FSLoopDSSPlayer {
    readonly isUsed: boolean;
    readonly isAdmin: boolean;
    readonly uptime: number;
    readonly name: string;
}

export interface FSLoopCSG {
    readonly careerSavegame: {
        readonly settings?: {
            readonly savegameName: { readonly _text: string },
            readonly creationDate: { readonly _text: string },
            readonly mapId: { readonly _text: string },
            readonly mapTitle: { readonly _text: string },
            readonly saveDateFormatted: { readonly _text: string },
            readonly saveDate: { readonly _text: string },
            readonly resetVehicles: { readonly _text: "true" | "false" },
            readonly trafficEnabled: { readonly _text: "true" | "false" },
            readonly stopAndGoBraking: { readonly _text: "true" | "false" },
            readonly trailerFillLimit: { readonly _text: "true" | "false" },
            readonly automaticMotorStartEnabled: { readonly _text: "true" | "false" },
            readonly growthMode: { readonly _text: "1" | "2" | "3" },
            readonly fixedSeasonalVisuals: { readonly _text: string },
            readonly plannedDaysPerPeriod: { readonly _text: string },
            readonly fruitDestruction: { readonly _text: "true" | "fase" },
            readonly plowingRequiredEnabled: { readonly _text: "true" | "fase" },
            readonly stonesEnabled: { readonly _text: "true" | "false" },
            readonly weedsEnabled: { readonly _text: "true" | "false" },
            readonly limeRequired: { readonly _text: "true" | "false" },
            readonly isSnowEnabled: { readonly _text: "true" | "false" },
            readonly fuelUsage: { readonly _text: string },
            readonly helperBuyFuel: { readonly _text: "true" | "false" },
            readonly helperBuySeeds: { readonly _text: "true" | "false" },
            readonly helperBuyFertilizer: { readonly _text: "true" | "false" },
            readonly helperSlurrySource: { readonly _text: string },
            readonly helperManureSource: { readonly _text: string },
            readonly densityMapRevision: { readonly _text: string },
            readonly terrainTextureRevision: { readonly _text: string },
            readonly terrainLodTextureRevision: { readonly _text: string },
            readonly splitShapesRevision: { readonly _text: string },
            readonly tipCollisionRevision: { readonly _text: string },
            readonly placementCollisionRevision: { readonly _text: string },
            readonly navigationCollisionRevision: { readonly _text: string },
            readonly mapDensityMapRevision: { readonly _text: string },
            readonly mapTerrainTextureRevision: { readonly _text: string },
            readonly mapTerrainLodTextureRevision: { readonly _text: string },
            readonly mapSplitShapesRevision: { readonly _text: string },
            readonly mapTipCollisionRevision: { readonly _text: string },
            readonly mapPlacementCollisionRevision: { readonly _text: string },
            readonly mapNavigationCollisionRevision: { readonly _text: string },
            readonly difficulty: { readonly _text: string },
            readonly economicDifficulty: { readonly _text: string },
            readonly dirtInterval: { readonly _text: string },
            readonly timeScale: { readonly _text: string },
            readonly autoSaveInterval: { readonly _text: string }
        }
        readonly statistics: {
            readonly money: { readonly _text: string }
            readonly playTime: { readonly _text: string }
        }
        readonly slotSystem: {
            readonly _attributes: {
                readonly slotUsage: string
            }
        }
    }
}

export interface YTCacheFeed {
    feed: {
        _attributes: {
            "xmlns:yt": string,
            "xmlns:media": string,
            xmlns: string
        },
        link: Array<{
            _attributes: {
                rel: string,
                href: string
            }
        }>,
        id: { _text: string },
        title: { _text: string },
        author: {
            name: { _text: string },
            uri: { _text: string }
        },
        published: { _text: string },
        entry: Array<{
            id: { _text: string },
            "yt:videoId": { _text: string },
            "yt:channelId": { _text: string },
            title: { _text: string },
            link: {
                _attributes: {
                    rel: string,
                    href: string
                }
            },
            author: {
                name: { _text: string },
                uri: { _text: string }
            },
            published: { _text: string },
            updated: { _text: string },
            "media:group": {
                "media:title": { _text: string },
                "media:content": {
                    _attributes: {
                        url: string,
                        type: string,
                        width: string,
                        height: string
                    }
                },
                "media:thumbnail": {
                    _attributes: {
                        url: string,
                        width: string,
                        height: string
                    }
                },
                "media:description": { _text: string },
                "media:community": {
                    "media:starRating": {
                        _attributes: {
                            count: string,
                            average: string,
                            min: string,
                            max: string
                        }
                    },
                    "media:statistics": {
                        _attributes: { views: string }
                    }
                }
            }
        }>
    }
}

export interface banFormat {
    blockedUserIds: {
        user: Array<{
            _attributes: {
                uniqueUserId: string,
                platformUserId: string,
                platformId: string,
                displayName: string
            }  
        }>
    }
}

export interface farmFormat {
    _declaration: {
        _attributes: {
            version: string,
            encoding: string,
            standalone: string
        }
    },
    farms: {
        farm: [
            greenFarm,
            staffFarm,
            staffFarm
        ]
    }
}
interface greenFarm {
    _attributes: {
        farmId: "1" | "2" | "3" | "4" | "5" | "6",
        name: string,
        color: string,
        loan: string,
        money: string
    },
    players: {
        player: Array<farmPlayer>
    }
}
interface staffFarm {
    _attributes: {
        farmId: "1" | "2" | "3" | "4" | "5" | "6",
        name: string,
        color: string,
        password: string
        loan: string,
        money: string
    },
    players?: {
        player: Array<farmPlayer> | farmPlayer
    }
}
interface farmPlayer {
    _attributes: {
        uniqueUserId: string,
        farmManager: "false" | "true",
        lastNickname: string,
        timeLastConnected: string,
        buyVehicle: "false" | "true",
        sellVehicle: "false" | "true",
        buyPlaceable: "false" | "true",
        sellPlaceable: "false" | "true",
        manageContracts: "false" | "true",
        radeAnimals: "false" | "true",
        createFields: "false" | "true",
        landscaping: "false" | "true",
        hireAssistant: "false" | "true",
        resetVehicle: "false" | "true",
        manageProductions: "false" | "true",
        cutTrees: "false" | "true",
        manageRights: "false" | "true",
        transferMoney: "false" | "true",
        updateFarm: "false" | "true",
        manageContracting: "false" | "true"
    }
}