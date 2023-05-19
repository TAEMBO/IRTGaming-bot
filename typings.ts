import YClient from './client.js';
import Discord, { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface RepeatedMessages {
    [key: string]: {
        data: Discord.Collection<number, {
            type: string,
            channel: string
        }>,
        timeout: NodeJS.Timeout
    }
}

export interface FSCache {
    [key: string]: {
        players: FS_player[],
        status: "online" | "offline" | null,
        lastAdmin: number | null
    }
}

export interface YTCache {
    [key: string]: string | null
}

export interface InviteCache {
    uses: number | null,
    creator: string | undefined
}

export interface Tokens {
    token: string,
    mongoURL: string
    ftp: {
        [key: string]: {
            host: string,
            user: string,
            password: string
            path: string
        },
    }
    fs: {
        [key: string]: {
            login: string,
            dss: string,
            csg: string
        },
    }
}

export interface Config {
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
        YTLoop: boolean,
        autoResponses: boolean,
        buttonRoles: boolean,
    },
    devWhitelist: Array<string>,
    FSCacheServers: Array<Array<string>>,
    YTCacheChannels: Array<Array<string>>,
    mainServer: {
        id: string,
        FSLoopMsgId: string,
        MPStaffRoles: Array<keyof Config["mainServer"]["roles"]>,
        staffRoles: Array<keyof Config["mainServer"]["roles"]>,
        roles: {
            admin: string,
            discordmoderator: string,
            discordhelper: string,
            mpmanager: string,
            mpsradmin: string,
            mpjradmin: string,
            mpfarmmanager: string,
            trustedfarmer: string,
            mpstaff: string,
            mpmanagement: string,
            loa: string,
            mfmanager: string,
            mffarmowner: string,
            mfmember: string,
            mffarm1: string,
            mffarm2: string,
            mffarm3: string,
            mffarm4: string,
            mffarm5: string,
            mffarm6: string,
            mffarm7: string,
            mffarm8: string,
            mffarm9: string,
            mffarm10: string,
            subscriber: string
            detained: string
        },
        channels: {
            botLogs: string,
            botCommands: string,
            mpPublicSilage: string,
            mpPublicGrain: string,
            welcome: string,
            general: string,
            taesTestingZone: string,
            communityIdeas: string,
            staffReports: string,
            fsLogs: string,
            juniorAdminChat: string,
            mpStaffCommands: string,
            watchList: string,
            videosAndLiveStreams: string
        }
    }
}

export interface Command {
    commandFile: {
        default: {
            run: (client: YClient, interaction: ChatInputCommandInteraction<"cached">) => any;
            data: SlashCommandBuilder;
        };
    };
    uses: number;
}

export interface FS_data {
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
        players: Array<FS_player>
    }
}

export interface FS_player {
    isUsed: boolean,
    isAdmin: boolean,
    uptime: number,
    name: string
}

export interface FS_careerSavegame {
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