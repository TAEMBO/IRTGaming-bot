import YClient from 'client.js';
import mongoose from 'mongoose';
import FTPClient from 'ftp';
import xjs from 'xml-js';
import config from '../config.json' assert { type: 'json' };
import { log } from '../utilities.js';
import { LogColor, farmFormat, ServerAcroList } from '../typings.js';

/** The object that each server will have */
const serverObj = {
	time: { type: Number, required: true },
	lastOn: { type: Number, required: true }
};

/** The schema containing the server's object */
const serverSchema = new mongoose.Schema(serverObj, { _id: false });

/** The base object for all servers */
const serversObj = {} as Record<ServerAcroList, { type: typeof serverSchema }>;

// Populate the base object with all server schemas by referencing config
for (const serverAcro of Object.keys(config.fs) as ServerAcroList[]) serversObj[serverAcro] = { type: serverSchema };

const Model = mongoose.model('playerTimes', new mongoose.Schema({
    _id: { type: String, required: true },
	uuid: { type: String },
	servers: { required: true, type: new mongoose.Schema(serversObj, { _id: false }) }
}, { versionKey: false }));

type Document = ReturnType<typeof Model.castObject>;

export default class playerTimes {
	public _content = Model;

	constructor(private client: YClient) { }
    
	/**
	 * Retrieve an array-ified form of a player's server time data.
	 * @param data The MongoDB document for the player
	 * @returns An array of all server time objects from the player, with the first element for each being the server's acronym
	 */
	getTimeData(data: Document) {
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
	async addPlayerTime(playerName: string, playerTime: number, serverAcro: ServerAcroList) {
		const now = Math.round(Date.now() / 1000);
		const playerData = await this._content.findById(playerName);

		if (playerData) {
			playerData.servers[serverAcro] = {
				time: (playerData.servers[serverAcro]?.time ?? 0) + playerTime,
				lastOn: now
			};
			return await playerData.save();
		} else return await this._content.create({
			_id: playerName,
			servers: {
				[serverAcro]: {
					time: playerTime,
					lastOn: now
				}
			}
		});
	}
	async fetchFarmData(serverAcro: ServerAcroList) {
		const FTP = new FTPClient();
		const allData = await this._content.find();

		FTP.once('ready', () => FTP.get(this.client.config.fs[serverAcro].ftp.path + 'savegame1/farms.xml', async (err, stream) => {
			log(LogColor.Yellow, `Downloaded farms.xml from ${serverAcro}, crunching...`);
			if (err) throw err;
            
			const farmData = xjs.xml2js(await new Response(stream as any).text(), { compact: true }) as farmFormat;
            let iterationCount = 0;

			for await (const player of farmData.farms.farm[0].players.player) {
				const playerDatabyUuid = allData.find(x => x.uuid === player._attributes.uniqueUserId);

				if (playerDatabyUuid) { // PlayerTimes data was found with UUID
					if (playerDatabyUuid._id !== player._attributes.lastNickname) { // PlayerTimes name does not match given name, update playerTimes data to reflect new name
						await this.client.getChan('fsLogs').send({ embeds: [new this.client.embed()
							.setColor(this.client.config.embedColorYellow)
							.setTitle('Player name change')
							.setTimestamp()
							.setDescription([
								`**UUID:** \`${playerDatabyUuid.uuid}\``,
								`**Old name:** ${playerDatabyUuid._id}`,
								`**New name:** ${player._attributes.lastNickname}`
							].join('\n'))
						] });
                        iterationCount++;
						
						await this._content.create({ _id: player._attributes.lastNickname, uuid: player._attributes.uniqueUserId, servers: playerDatabyUuid.servers })
							.then(() => playerDatabyUuid.delete()) // New name is unoccupied, delete old name data
							.catch(async () => { // New name is occupied
								playerDatabyUuid.uuid = undefined; // Remove UUID from old name
								await playerDatabyUuid.save();
								await this._content.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId }, { new: true }); // Add UUID to new name
							});
					}
				} else { // No playerTimes data was found with UUID
					const playerDataByName = allData.find(x => x._id === player._attributes.lastNickname);
					if (playerDataByName && !playerDataByName.uuid) await this._content.findByIdAndUpdate(player._attributes.lastNickname, { uuid: player._attributes.uniqueUserId }, { new: true });
				}
			}
            this.client.getChan('fsLogs').send(`⚠️ Name change detector ran. Iterated over ${iterationCount} changed names`);
			log(LogColor.Yellow, 'Finished crunching farms.xml data');
			stream.once('close', () => FTP.end());
		})).connect(this.client.config.fs[serverAcro].ftp);
	}
}