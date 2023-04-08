import Discord from 'discord.js';

export interface Tokens {
    token: string,
    mongoURL: string
    ftp: {
        [key: string]: FTPLogins,
        ps: FTPLogins,
        pg: FTPLogins
    }
    fs: {
        [key: string]: FSURLs,
        ps: FSURLs,
        pg: FSURLs,
        mf: FSURLs
    }
}
interface FSURLs {
    login: string,
    dss: string,
    csg: string
}
interface FTPLogins {
    host: string,
    user: string,
    password: string
    path: string
}

export interface Config {
    embedColor: '#hexColor',
    embedColorGreen: '#hexColor',
    embedColorRed: '#hexColor',
    embedColorYellow: '#hexColor',
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
        errorNotify: boolean
    },
    devWhitelist: Array<string>,
    watchListPings: Array<string>,
    mainServer: {
        id: string,
        MPStaffRoles: Array<string>,
        staffRoles: Array<string>,
        roles: {
            [key: string]: string,
            owner: string,
            mod: string,
            helper: string,
            mpmanager: string,
            mpadmin: string,
            mppublicadmin: string,
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
        },
        channels: {
            [key: string]: string,
            botlogs: string,
            botcommands: string,
            fs22_silage: string,
            fs22_grain: string,
            welcome: string,
            testing_zone: string,
            suggestions: string,
            staffreports: string,
            fslogs: string,
            playercheck: string,
            watchlist: string,
            vidsandstreams: string
        }
    }
}

export interface FSCache {
    [key: string]: FSCacheServer,
    ps: FSCacheServer,
    pg: FSCacheServer
}

export interface FSCacheServer {
    players: Array<FS_player>,
    status: undefined | "online" | "offline",
    lastAdmin: undefined | number
}

export interface Punishment {
    _id: number;
    type: string;
    member: { tag: string, _id: string };
    moderator: string;
    expired?: boolean;
    time: number;
    reason: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
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