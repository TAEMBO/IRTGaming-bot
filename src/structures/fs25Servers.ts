import config from "#config" with { type: "json" };
import type { FSServer, FSServerPrivate, FSServerPublic } from "#typings";

/** A manager for object data for all Farming Simulator servers */
export class FS25Servers {
    public constructor(public data: typeof config.fs25) { }

    /**
     * @returns An array of server acronyms
     */
    public keys() {
        return Object.keys(this.data);
    }

    /**
     * @returns An array of objects of all servers
     */
    public values() {
        return Object.values(this.data) as FSServer[];
    }

    /**
     * @returns An array of entries of all servers
     */
    public entries() {
        return Object.entries(this.data) as [string, FSServer][];
    }

    /**
     * @returns An array of entries of all public servers
     */
    public getPublicAll() {
        return this.entries().filter((x): x is [string, FSServerPublic] => !x[1].isPrivate);
    }

    /**
     * @returns An array of all public server names
     */
    public getPublicNames() {
        return this.getPublicAll().map(([_, x]) => x.fullName);
    }

    /**
     * @param serverAcro The server to index for
     * @returns An entry of a public server
     */
    public getPublicOne(serverAcro: string) {
        const server = this.getPublicAll().find(x => x[0] === serverAcro);

        if (!server) throw new Error(`Public FS server entry not found: ${serverAcro}`);

        return server[1];
    }

    /**
     * @returns An array of entries of all private servers
     */
    public getPrivateAll() {
        return this.entries().filter((x): x is [string, FSServerPrivate] => x[1].isPrivate);
    }

    /**
     * @returns An array of all private server names
     */
    public getPrivateNames() {
        return this.getPrivateAll().map(([_, x]) => x.fullName);
    }

    /**
     * @param serverAcro The server to index for
     * @returns An entry of a private server
     */
    public getPrivateOne(serverAcro: string) {
        const server = this.getPrivateAll().find(x => x[0] === serverAcro);

        if (!server) throw new Error(`Private FS server data not found: ${serverAcro}`);

        return server[1];
    }
}