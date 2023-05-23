import Discord from 'discord.js';
import YClient from 'client.js';
import mongoose from 'mongoose';
import FTPClient from 'ftp';
import xjs from 'xml-js';
import { farmFormat } from 'typings.js';

const Schema = mongoose.model('playerTimes', new mongoose.Schema({
    _id: { type: String },
    time: { type: Number, required: true },
    lastOn: { type: Number, required: true },
	uuid: { type: String }
}, { versionKey: false }));

export default class playerTimes extends Schema {
	public _content = Schema;
	constructor(private client: YClient) {
		super();
	}
	async addPlayerTime(playerName: string, playerTime: number) {
		const now = Math.round(Date.now() / 1000);
		const playerData = await this._content.findById(playerName);
		if (playerData) {
			return await this._content.findByIdAndUpdate(playerName, { time: playerData.time + playerTime, lastOn: now }, { new: true });
		} else return await this._content.create({ _id: playerName, time: playerTime, lastOn: now });
	}
	async fetchFarmData(serverAcro: string) {
		const FTP = new FTPClient();
		const allData = await this._content.find();
		const channel = this.client.channels.resolve(this.client.config.mainServer.channels.fsLogs) as Discord.TextChannel;

		FTP.once('ready', () => FTP.get(this.client.config.ftp[serverAcro].path + 'savegame1/farms.xml', async (err, stream) => {
			this.client.log('\x1b[33m', `Downloaded farms.xml from ${serverAcro}, crunching...`);
			if (err) throw err;
			const farmData = xjs.xml2js(await new Response(stream as any).text(), { compact: true }) as farmFormat;

			for await (const player of farmData.farms.farm[0].players.player) {
				const playerDatabyUuid = allData.find(x => x.uuid === player._attributes.uniqueUserId);

				if (playerDatabyUuid) { // PlayerTimes data was found with UUID
					if (playerDatabyUuid._id !== player._attributes.lastNickname) { // PlayerTimes name does not match given name, update playerTimes data to reflect new name
						await channel.send({embeds: [new this.client.embed()
							.setColor(this.client.config.embedColorYellow)
							.setTitle('Player name change')
							.setTimestamp()
							.setDescription([
								`**UUID:** \`${playerDatabyUuid.uuid}\``,
								`**Old name:** ${playerDatabyUuid._id}`,
								`**New name:** ${player._attributes.lastNickname}`
							].join('\n'))
						]});
						
						await this._content.create({ _id: player._attributes.lastNickname, time: playerDatabyUuid.time, lastOn: playerDatabyUuid.lastOn, uuid: player._attributes.uniqueUserId })
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
			this.client.log('\x1b[33m', 'Finished crunching farms.xml data');
			stream.once('close', () => FTP.end());
		})).connect(this.client.config.ftp[serverAcro]);
	}
}