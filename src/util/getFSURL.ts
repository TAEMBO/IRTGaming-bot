import type { FSServer } from "../typings.js";

/**
 * Get a given URL for an FS server
 * @param server The FS server object to use data from
 * @param endpoint The URL endpoint to get
 * @returns A full HTTP URL for the given endpoint
 */
export function getFSURL<S extends "dss" | "csg" | "login">(server: FSServer, endpoint: S) {
    return ({
        dss: `http://${server.address}/feed/dedicated-server-stats.json?code=${server.code}` as const,
        csg: `http://${server.address}/feed/dedicated-server-savegame.html?code=${server.code}&file=careerSavegame` as const,
        login: `http://${server.address}/index.html?login=true&username=${server.username}&password=${server.password}` as const
    })[endpoint];
}