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
	reason?: string,
	interaction?: any
}
export interface db_punishments_format {
    id: number;
    type: string;
    member: string;
    moderator: string;
    expired?: boolean;
    time: number;
    reason?: string;
    endTime?: number;
    cancels?: number;
    duration?: number;
}
interface FSURLs {
    dss: string,
    csg: string
}
export interface tokens {
    token: string
    ps: FSURLs
    pg: FSURLs
    mf: FSURLs
    test: FSURLs
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
export interface db_userLevels_format {
    messages: number,
    level: number
}
export interface Reminder {
    when: number,
    what: string,
    who: string
}