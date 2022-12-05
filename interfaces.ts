import Discord from 'discord.js';

export interface tokens {
    token: string
    ps: FSURLs
    pg: FSURLs
    mf: FSURLs
    test: FSURLs
}
interface FSURLs {
    dss: string,
    csg: string
}

export interface global_formatTimeOpt {
    longNames: boolean,
    commas: boolean
}
export interface global_createTableOpt {
    columnAlign: Array<string>, 
    columnSeparator: Array<string>, 
    columnEmptyChar?: any
}

export interface db_tictactoe_tttPlayer {
    wins: number;
    losses: number;
    draws: number;
    total: number;
}
export interface db_tictactoe_tttGame {
    players: Array<string>;
    winner: string;
    startTime: number;
    endTime: number;
    draw?: boolean;
}
export interface db_punishments_passthruOpt {
	time?: string,
	interaction?: Discord.ChatInputCommandInteraction<"cached">
}
export interface db_punishments_format {
    id: number;
    type: string;
    member: string;
    moderator: string;
    expired?: boolean;
    time: number;
    reason: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}
export interface db_userLevels_format {
    messages: number,
    level: number
}

export interface FSdss_serverName {
    data: FS_data
}
export interface FS_data {
    server: FS_server,
    slots: FS_slots
}
export interface FS_server {
        dayTime: number,
        game: string,
        mapName: string,
        mapSize: number,
        mapOverviewFilename: string,
        money: number,
        name: string,
        server: string,
        version: string
}
export interface FS_slots {
    capacity: number,
    used: number,
    players: Array<FS_players>
}
export interface FS_players {
    isUsed: boolean,
    isAdmin: boolean,
    uptime: number,
    name: string
}

export interface FS_careerSavegame {
    settings: FS_careerSavegame_settings
    statistics: FS_careerSavegame_statistics
    slotSystem: FS_careerSavegame_slotSystem
}
export interface FS_careerSavegame_settings {
    savegameName: XMLtext,
    creationDate: XMLtext,
    mapId: XMLtext,
    mapTitle: XMLtext,
    saveDateFormatted: XMLtext,
    saveDate: XMLtext,
    resetVehicles: XMLtext,
    trafficEnabled: XMLtext,
    stopAndGoBraking: XMLtext,
    trailerFillLimit: XMLtext,
    automaticMotorStartEnabled: XMLtext,
    growthMode: XMLtext,
    fixedSeasonalVisuals: XMLtext,
    plannedDaysPerPeriod: XMLtext,
    fruitDestruction: XMLtext,
    plowingRequiredEnabled: XMLtext,
    stonesEnabled: XMLtext,
    weedsEnabled: XMLtext,
    limeRequired: XMLtext,
    isSnowEnabled: XMLtext,
    fuelUsage: XMLtext,
    helperBuyFuel: XMLtext,
    helperBuySeeds: XMLtext,
    helperBuyFertilizer: XMLtext,
    helperSlurrySource: XMLtext,
    helperManureSource: XMLtext,
    densityMapRevision: XMLtext,
    terrainTextureRevision: XMLtext,
    terrainLodTextureRevision: XMLtext,
    splitShapesRevision: XMLtext,
    tipCollisionRevision: XMLtext,
    placementCollisionRevision: XMLtext,
    navigationCollisionRevision: XMLtext,
    mapDensityMapRevision: XMLtext,
    mapTerrainTextureRevision: XMLtext,
    mapTerrainLodTextureRevision: XMLtext,
    mapSplitShapesRevision: XMLtext,
    mapTipCollisionRevision: XMLtext,
    mapPlacementCollisionRevision: XMLtext,
    mapNavigationCollisionRevision: XMLtext,
    difficulty: XMLtext,
    economicDifficulty: XMLtext,
    dirtInterval: XMLtext,
    timeScale: XMLtext,
    autoSaveInterval: XMLtext
}
export interface FS_careerSavegame_statistics {
    money: XMLtext
    playTime: XMLtext
}
export interface FS_careerSavegame_slotSystem {
    _attributes: slotUsage
}
interface slotUsage {
    slotUsage: string
}
interface XMLtext {
    _text: string
}

export interface Reminder {
    when: number,
    what: string,
    who: string
}