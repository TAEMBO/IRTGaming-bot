import fs from 'node:fs';

class Database {
	public _path: string;
	public _content: Array<string>;
	constructor(dir: string) {
		this._path = dir;
		this._content = [];
	}
	addData(data: string) {
		this._content.push(data);
		return this;
	}
	removeData(data: string) {
		this._content = this._content.filter(x => x !== data);
		return this;
	}
	initLoad = () => this._content = JSON.parse(fs.readFileSync(this._path, 'utf8'));

	forceSave = () => fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2));
}

export class bannedWords extends Database { constructor() { super("./databases/bannedWords.json") } };

export class TFlist extends Database { constructor() { super("./databases/TFlist.json") } };

export class FMlist extends Database { constructor() { super("./databases/FMlist.json") } };