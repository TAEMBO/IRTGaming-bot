import { EmbedBuilder } from 'discord.js';
import YClient from '../client.js';
import mongoose from 'mongoose';
import FTPClient from 'ftp';
import xjs from 'xml-js';
import config from '../config.json' assert { type: 'json' };
import { FSServers, log, stringifyStream } from '../utilities.js';
import { farmFormat } from '../typings.js';

/** The object that each server will have */
const serverObj = {
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

export default class PlayerTimes {
	public data = model;

	constructor(private client: YClient) { }
    
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
				time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
				lastOn: now
			};
			return await playerData.save();
		} else return await this.data.create({
			_id: playerName,
			servers: {
				[serverAcro]: {
					time: playerTime,
					lastOn: now
				}
			}
		});
	}

	public async fetchFarmData(serverAcro: string) {
		const FTP = new FTPClient();
		const allData = await this.data.find();
        const fsServers = new FSServers(this.client.config.fs);

		FTP.once('ready', () => FTP.get(fsServers.getPublicOne(serverAcro).ftp.path + 'savegame1/farms.xml', async (err, stream) => {
			log('Yellow', `Downloaded farms.xml from ${serverAcro}, crunching...`);
			if (err) throw err;
            
			const farmData = xjs.xml2js(await stringifyStream(stream), { compact: true }) as farmFormat;
            let iterationCount = 0;

			for await (const player of farmData.farms.farm[0].players.player) {
				const playerDatabyUuid = allData.find(x => x.uuid === player._attributes.uniqueUserId);

				if (playerDatabyUuid) { // PlayerTimes data was found with UUID
					if (playerDatabyUuid._id !== player._attributes.lastNickname) { // PlayerTimes name does not match given name, update playerTimes data to reflect new name
                        const decorators = (name: string) => {
                            return [
                                this.client.fmList.data.includes(name) ? ':farmer:' : '', // Tag for if player is FM
                                this.client.tfList.data.includes(name) ? ':angel:' : '' // Tag for if player is TF
                            ].join('');
                        }

						await this.client.getChan('fsLogs').send({ embeds: [new EmbedBuilder()
							.setColor(this.client.config.embedColorYellow)
							.setTitle('Player name change')
							.setTimestamp()
							.setDescription([
								`**UUID:** \`${playerDatabyUuid.uuid}\``,
								`**Old name:** ${playerDatabyUuid._id} ${decorators(playerDatabyUuid._id)}`,
								`**New name:** ${player._attributes.lastNickname} ${decorators(player._attributes.lastNickname)}`
							].join('\n'))
						] });
                        iterationCount++;
						
						await this.data.create({ _id: player._attributes.lastNickname, uuid: player._attributes.uniqueUserId, servers: playerDatabyUuid.servers })
							.then(() => this.data.findByIdAndDelete(playerDatabyUuid._id)) // New name is unoccupied, delete old name data
							.catch(async () => { // New name is occupied
								playerDatabyUuid.uuid = undefined; // Remove UUID from old name
								await playerDatabyUuid.save();
								await this.data.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId, discordid: playerDatabyUuid.discordid }, { new: true }); // Add UUID to new name
							});
					}
				} else { // No playerTimes data was found with UUID
					const playerDataByName = allData.find(x => x._id === player._attributes.lastNickname);
					if (playerDataByName && !playerDataByName.uuid) await this.data.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId }, { new: true });
				}
			}
            
            await this.client.getChan('fsLogs').send(`⚠️ Name change detector ran. Iterated over ${iterationCount} changed names`);
			log('Yellow', 'Finished crunching farms.xml data');
			stream.once('close', () => FTP.end());
		})).connect(fsServers.getPublicOne(serverAcro).ftp);
	}
}