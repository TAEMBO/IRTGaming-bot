import Discord, { ColorResolvable } from 'discord.js';

export interface Tokens {
    [key: string]: string | FTPServers | FSURLs
    token: string
    ftp: FTPServers
    ps: FSURLs
    pg: FSURLs
    mf: FSURLs
    test: FSURLs
}
export interface FSURLs {
    login: string,
    dss: string,
    csg: string
}
interface FTPServers {
    ps: FTPLogins
    pg: FTPLogins
}
interface FTPLogins {
    host: string,
    user: string,
    password: string
}

export interface Config {
    embedColor: ColorResolvable
    embedColorGreen: ColorResolvable,
    embedColorRed: ColorResolvable,
    embedColorYellow: ColorResolvable
    botSwitches: botSwitches,
    devWhitelist: Array<string>,
    mainServer: mainServer
}
interface botSwitches {
    commands: boolean
    automod: boolean,
    logs: boolean
    registerCommands: boolean,
    stats: boolean,
    autoResponses: boolean,
    notifs: boolean,
    errorNotify: boolean
}
interface mainServer {
    id: string,
    MPStaffRoles: Array<string>,
    staffRoles: Array<string>
    roles: mainServerRoles
    channels: mainServerChannels

}
interface mainServerRoles {
    [key: string]: string
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
    mffarm11: string,
    subscriber: string
}
interface mainServerChannels {
    [key: string]: string
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

export interface FSCache {
    [key: string]: any
    statsGraph: number
    ps: FSCacheServer
    pg: FSCacheServer
    mf: FSCacheServer

}
export interface FSCacheServer {
    new: Array<FS_players>, 
    old: Array<FS_players>, 
    status: undefined | number
}

export interface YTCache {
    [key: string]: undefined | string
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
    member: db_punishments_format_member;
    moderator: string;
    expired?: boolean;
    time: number;
    reason: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}
export interface db_punishments_format_member {
    tag: string
    id: string
}
export interface db_userLevels_format {
    messages: number,
    level: number
}
export interface db_playerTimes_format {
    time: number;
    lastOn: number | null
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
export interface FS_csg {
    careerSavegame: FS_careerSavegame
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