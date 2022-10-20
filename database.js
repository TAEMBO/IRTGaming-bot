const path = require('path');
const fs = require('fs');
const moment = require('moment');
class Database {
	constructor(dir, dataType) {
		this._dataType = dataType;
		this._path = path.resolve(dir);
		this._interval = undefined;
		this._saveNotifs = true;
		this._content = dataType === 'array' ? [] : dataType === 'object' ? {} : undefined;
	}
	addData(data, data1) {
		if (this._dataType === 'array') {
			this._content.push(data);
		} else if (this._dataType === 'object') {
			this._content[data] = data1;
		}
		return this;
	}
	removeData(key, type, element) {
		if (this._dataType === 'array') {
			switch (type) {
				case 0:
					this._content = this._content.filter(x => x != key);
					break;
				case 1:
					this._content = this._content.filter(x => x[element] != key)
					break;
				default: 
					return 'Type must be properly specified';
			}
		} else if (this._dataType === 'object') {
			delete this._content[key];
		}
		return this;
	}
	initLoad() {
		this._content = JSON.parse(fs.readFileSync(this._path));
		console.log(this._path + ' Database Loaded');
		return this;
	}
	forceSave(db = this, force = false) {
		const oldJson = fs.readFileSync(db._path, { encoding: 'utf8' });
		const newJson = JSON.stringify(db._content);
		if (oldJson !== newJson || force) {
			fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2));
			if (this._saveNotifs) console.log(`\x1b[36m[${moment().format('HH:mm:ss')}] \x1b[33m` + this._path + ' Database Saved');
		}
		return db;
	}
	intervalSave(milliseconds) {
		this._interval = setInterval(() => this.forceSave(this), milliseconds || 60000);
		return this;
	}
	stopInterval() {
		if (this._interval) clearInterval(this._interval);
		return this;
	}
	disableSaveNotifs() {
		this._saveNotifs = false;
		console.log(this._path + ' "Database Saved" Notifications Disabled');
		return this;
	}
}
module.exports = Database;