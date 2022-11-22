import path from 'node:path';
import fs from 'node:fs';
import moment from 'moment';
export default class Database {
	public _dataType: string;
	public _path: string;
	public _interval?: NodeJS.Timer;
	public _saveNotifs: boolean;
	public _content: any;
	constructor(dir: string, dataType: string) {
		this._dataType = dataType;
		this._path = path.resolve(dir);
		this._interval = undefined;
		this._saveNotifs = true;
		this._content = dataType === 'array' ? [] : {};
	}
	addData(data: any, data1?: any) {
		if (Array.isArray(this._content)) {
			this._content.push(data);
		} else if (typeof this._content === "object") {
			this._content[data] = data1;
		}
		return this;
	}
	removeData(key: any, type: number, element: any) {
		if (this._dataType === 'array') {
			switch (type) {
				case 0:
					this._content = this._content.filter((x: any) => x != key);
					break;
				case 1:
					this._content = this._content.filter((x: any) => x[element] != key)
					break;
			}
		} else if (this._dataType === 'object') {
			delete this._content[key];
		}
		return this;
	}
	initLoad() {
		this._content = JSON.parse(fs.readFileSync(this._path, { encoding: 'utf8' }));
		console.log(this._path.replace(__dirname, '') + ' Database Loaded');
		return this;
	}
	forceSave(db = this, force = false) {
		const oldJson = fs.readFileSync(db._path, { encoding: 'utf8' });
		const newJson = JSON.stringify(db._content);
		if (oldJson !== newJson || force) {
			fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2));
			if (this._saveNotifs) console.log(`[${moment().format('HH:mm:ss')}] ` + this._path.replace(__dirname, '') + ' Database Saved');
		}
		return db;
	}
	intervalSave(milliseconds?: number) {
		this._interval = setInterval(() => this.forceSave(this), milliseconds || 60000);
		return this;
	}
	stopInterval() {
		if (this._interval) clearInterval(this._interval);
		return this;
	}
	disableSaveNotifs() {
		this._saveNotifs = false;
		console.log(this._path.replace(__dirname, '') + ' "Database Saved" Notifications Disabled');
		return this;
	}
}