import { Config, FSServerBase, FSServerPrivate, FSServerPublic } from "../typings.js";

/** A manager for object data for all Farming Simulator servers */
export class FSServers {
    constructor(public data: Config['fs']) { }

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
        return Object.values(this.data);
    }

    /**
     * @returns An array of entries of all servers
     */
    public entries() {
        return Object.entries(this.data);
    }

    /**
     * @returns An array of entries of all public servers
     */
    public getPublicAll() {
        return this.entries().filter(x => !x[1].isPrivate) as [string, FSServerBase & FSServerPublic][];
    }
    
    /**
     * 
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
        return this.entries().find(x => x[0] === serverAcro)?.[1] as FSServerBase & FSServerPublic;
    }

    /**
     * @returns An array of entries of all private servers
     */
    public getPrivateAll() {
        return this.entries().filter(x => x[1].isPrivate) as [string, FSServerBase & FSServerPrivate][];
    }

    /**
     * 
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
        return this.entries().find(x => x[0] === serverAcro)?.[1] as FSServerBase & FSServerPrivate;
    }
};