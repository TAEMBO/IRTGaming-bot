import { EmbedBuilder } from "discord.js";
import type TClient from "../client.js";
import config from "../config.json" assert { type: "json" };
import FTPClient from "ftp";
import mongoose from "mongoose";
import { Snowflake } from "@sapphire/snowflake";
import { xml2js } from "xml-js";
import { FSServers, log, stringifyStream } from "../utils.js";
import type { farmFormat } from "../typings.js";

/** The object that each server will have */
const serverObj = {
    name: { type: String, required: true },
	time: { type: Number, required: true },
	lastOn: { type: Number, required: true }
};

/** The base object to contain all server object data */
const serversObj: Record<string, { type: typeof serverObj, _id: boolean }> = {};

// Populate the base object with all server objects by referencing config
for (const serverAcro of Object.keys(config.fs)) serversObj[serverAcro] = { type: serverObj, _id: false };

const model = mongoose.model('playerTimes', new mongoose.Schema({
    _id: { type: String, required: true },
	uuid: { type: String },
    discordid: { type: String },
	servers: { type: serversObj, required: true, _id: false }
}, { versionKey: false }));

export type PlayerTimesDocument = ReturnType<typeof model.castObject>;

export class PlayerTimes {
	public data = model;
    private readonly _snowflake = new Snowflake(config.PLAYERTIMES_START_UNIX);

	constructor(private readonly _client: TClient) { }
    
	/**
	 * Retrieve an array-ified form of a player's server time data.
	 * @param data The MongoDB document for the player
	 * @returns An array of all server time objects from the player, with the first element for each being the server's acronym
	 */
	public getTimeData(data: PlayerTimesDocument) {
		return (Object.entries(Object.values(data.servers)[3]) as unknown) as [string, {
            [key in keyof typeof serverObj]: number;
        }][];
	}

    private createSnowflake() {
        return this._snowflake.generate().toString();
    }

	/**
	 * Add server-specific time to a player's data.
	 * @param playerName The name of the player, a string
	 * @param playerTime The amount of time to add to their data, a number
	 * @param serverAcro The lowercase acronym for the server to add the time to, a string
	 * @returns The MongoDB document for the player, a Promise
	 */
	public async addPlayerTime(playerName: string, playerTime: number, serverAcro: string) {
		const now = Math.round(Date.now() / 1000);
		const playerData = await this.data.findById(playerName);

		if (playerData) {
			playerData.servers[serverAcro] = {
                name: playerData.servers[serverAcro].name,
				time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
				lastOn: now
			};
			return await playerData.save();
		} else return await this.data.create({
			_id: this.createSnowflake(),
			servers: {
				[serverAcro]: {
                    name: playerName,
					time: playerTime,
					lastOn: now
				}
			}
		});
	}

	public async fetchFarmData(serverAcro: string) {
		const FTP = new FTPClient();
		const allData = await this.data.find();
        const fsServers = new FSServers(this._client.config.fs);
        const server = fsServers.getPublicOne(serverAcro);
        const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            FTP.once("ready", () => FTP.get(server.ftp.path + 'savegame1/farms.xml', (err, stream) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stream);
                }
            })).connect(server.ftp);
        });

        log('Yellow', `Downloaded farms.xml from ${serverAcro}, crunching...`);

        const farmData = xml2js(await stringifyStream(stream), { compact: true }) as farmFormat;
        let changedNameCount = 0;
        let addedUuidCount = 0;

		for await (const player of farmData.farms.farm[0].players.player) {
			const playerDatabyUuid = allData.find(x => x.uuid === player._attributes.uniqueUserId);

			if (playerDatabyUuid) { // PlayerTimes data was found with UUID
                if (playerDatabyUuid._id === player._attributes.lastNickname) continue; // PlayerTimes name matches farm name, no need to update playerTimes data
                
                const decorators = (name: string) => {
                    return [
                        this._client.fmList.data.includes(name) ? ':farmer:' : '', // Tag for if player is FM
                        this._client.tfList.data.includes(name) ? ':angel:' : '' // Tag for if player is TF
                    ].join('');
                }

				await this._client.getChan('fsLogs').send({ embeds: [new EmbedBuilder()
					.setColor(this._client.config.EMBED_COLOR_YELLOW)
					.setTitle('Player name change')
					.setTimestamp()
					.setDescription([
						`**UUID:** \`${playerDatabyUuid.uuid}\``,
						`**Old name:** ${playerDatabyUuid._id} ${decorators(playerDatabyUuid._id)}`,
						`**New name:** ${player._attributes.lastNickname} ${decorators(player._attributes.lastNickname)}`
					].join('\n'))
				] });

                changedNameCount++;
				
				await this.data.create({ _id: player._attributes.lastNickname, uuid: player._attributes.uniqueUserId, servers: playerDatabyUuid.servers })
					.then(() => this.data.findByIdAndDelete(playerDatabyUuid._id)) // New name was not occupied, delete old name data
					.catch(async () => { // New name was occupied
						playerDatabyUuid.uuid = undefined; // Remove UUID from old name

						await playerDatabyUuid.save();
						await this.data.findByIdAndUpdate(
                            player._attributes.lastNickname,
                            {
                                uuid: player._attributes.uniqueUserId,
                                discordid: playerDatabyUuid.discordid
                            },
                            { new: true }
                        ); // Add UUID to new name
					});
			} else { // No playerTimes data was found with UUID
				const playerDataByName = allData.find(x => x._id === player._attributes.lastNickname);

				if (playerDataByName && !playerDataByName.uuid) {
                    await this.data.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId }, { new: true });

                    addedUuidCount++;
                }
			}
		}
        
        await this._client.getChan('fsLogs').send([
            `⚠️ Farm data cruncher ran on ${server.fullName}`,
            `Iterated over ${changedNameCount} changed names`,
            `Added playerTimes UUID data to ${addedUuidCount} names`
        ].join("\n"));

		log('Yellow', 'Finished crunching farms.xml data');
		stream.once('close', FTP.end);
	}
}