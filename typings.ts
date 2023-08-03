import YClient from './client.js';
import Discord from 'discord.js';
import config from './config.json' assert { type: 'json' };

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

export interface APIUser {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
    flags: number;
    banner: string | null;
    accent_color: number | null;
    global_name: string | null;
    avatar_decoration: null;
    display_name: string | null;
    banner_color: string | null;
};

export type ServerAcroList = keyof typeof config.fs;

export type GuildMemberOrInt = Discord.GuildMember | Discord.ChatInputCommandInteraction<"cached">;

export type RepeatedMessagesData = Record<string, {
    data: Discord.Collection<number, {
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

export type Registry = Discord.ApplicationCommandDataResolvable[];

export interface InviteCache {
    uses: number | null,
    creator: string | undefined
}

export interface Command {
    commandFile: {
        default: {
            run(interaction: Discord.ChatInputCommandInteraction<"cached">): Promise<any>;
            data: Omit<Discord.SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | Discord.SlashCommandSubcommandsOnlyBuilder;
        };
    };
    uses: number;
}

/** `Discord.ChatInputCommandInteraction<CacheType>` */
export interface TInteraction extends Discord.ChatInputCommandInteraction<"cached"> {
    client: YClient;
}

/** Template for creating a config.json */
export interface Config {
    /** The Discord bot client token */
    token: string,
    /** The URL for connecting to a MongoDB server */
    mongoURL: string,
    embedColor: `#${string}`,
    embedColorGreen: `#${string}`,
    embedColorRed: `#${string}`,
    embedColorYellow: `#${string}`,
    statsGraphSize: number,
    botPresence: Discord.PresenceData,
    botSwitches: {
        commands: boolean,
        automod: boolean,
        logs: boolean,
        registerCommands: boolean,
        FSLoop: boolean,
        ytLoop: boolean,
        autoResponses: boolean,
        buttonRoles: boolean,
    },
    /** An object for managing and communicating with Farming Simulator servers, keyed by their abbreviated acronym */
    fs: Record<ServerAcroList, {
        /** The unabbreviated name of the server */
        fullName: string;
        /** Whether or not the server is a public server with no password */
        isPrivate: boolean;
        /** The time zone difference between the server's location and UTC in minutes */
        utcDiff: number;
        /** The channel ID for the server's stats embed, used in FSLoop */
        channelId: string;
        /** The message ID for the server's stats embed, used in FSLoop */
        messageId: string;
        /** The dedicated server panel login for the server */
        login: string;
        /** The Link XML URL for the server (w/ .json extension) */
        dss: string;
        /** The Link Savegame File (careerSavegame) URL */
        csg: string;
        /** The FTP details for the server */
        ftp: {
            host: string;
            user: string;
            password: string;
            /** The path to navigate to the game's profile folder */
            path: string;
        };
    }>;
    /** A list of user IDs that are considered developers of this bot */
    devWhitelist: Array<string>,
    /** A list of channel IDs that messageUpdate and messageDelete logs do not apply to  */
    blacklistedCh: Array<string>,
    /** A list of channel IDs that automod does not apply to */
    whitelistedCh: Array<string>;
    /** `Array<[ChannelID, ChannelName]>` */
    ytCacheChannels: Array<Array<string>>,
    mainServer: {
        /** The ID of the guild that this bot is for */
        id: string;
        FSLoopMsgId: string;
        TFListMsgId: string;
        MFFarmRoles: Array<keyof Config["mainServer"]["roles"]>;
        MPStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        DCStaffRoles: Array<keyof Config["mainServer"]["roles"]>;
        roles: Record<keyof typeof config.mainServer.roles, string>;
        channels: Record<keyof typeof config.mainServer.channels, string>;
    }
}

export interface FSLoopDSS {
    server: {
        dayTime: number,
        game: string,
        mapName: string,
        mapSize: number,
        mapOverviewFilename: string,
        money: number,
        name: string,
        server: string,
        version: string
    },
    slots: {
        capacity: number,
        used: number,
        players: Array<FSLoopDSSPlayer>
    }
}

export interface FSLoopDSSPlayer {
    isUsed: boolean,
    isAdmin: boolean,
    uptime: number,
    name: string
}

export interface FSLoopCSG {
    settings: {
        savegameName: { _text: string },
        creationDate: { _text: string },
        mapId: { _text: string },
        mapTitle: { _text: string },
        saveDateFormatted: { _text: string },
        saveDate: { _text: string },
        resetVehicles: { _text: "true" | "false" },
        trafficEnabled: { _text: "true" | "false" },
        stopAndGoBraking: { _text: "true" | "false" },
        trailerFillLimit: { _text: "true" | "false" },
        automaticMotorStartEnabled: { _text: "true" | "false" },
        growthMode: { _text: "1" | "2" | "3" },
        fixedSeasonalVisuals: { _text: string },
        plannedDaysPerPeriod: { _text: string },
        fruitDestruction: { _text: "true" | "fase" },
        plowingRequiredEnabled: { _text: "true" | "fase" },
        stonesEnabled: { _text: "true" | "false" },
        weedsEnabled: { _text: "true" | "false" },
        limeRequired: { _text: "true" | "false" },
        isSnowEnabled: { _text: "true" | "false" },
        fuelUsage: { _text: string },
        helperBuyFuel: { _text: "true" | "false" },
        helperBuySeeds: { _text: "true" | "false" },
        helperBuyFertilizer: { _text: "true" | "false" },
        helperSlurrySource: { _text: string },
        helperManureSource: { _text: string },
        densityMapRevision: { _text: string },
        terrainTextureRevision: { _text: string },
        terrainLodTextureRevision: { _text: string },
        splitShapesRevision: { _text: string },
        tipCollisionRevision: { _text: string },
        placementCollisionRevision: { _text: string },
        navigationCollisionRevision: { _text: string },
        mapDensityMapRevision: { _text: string },
        mapTerrainTextureRevision: { _text: string },
        mapTerrainLodTextureRevision: { _text: string },
        mapSplitShapesRevision: { _text: string },
        mapTipCollisionRevision: { _text: string },
        mapPlacementCollisionRevision: { _text: string },
        mapNavigationCollisionRevision: { _text: string },
        difficulty: { _text: string },
        economicDifficulty: { _text: string },
        dirtInterval: { _text: string },
        timeScale: { _text: string },
        autoSaveInterval: { _text: string }
    }
    statistics: {
        money: { _text: string }
        playTime: { _text: string }
    }
    slotSystem: {
        _attributes: {
            slotUsage: string
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