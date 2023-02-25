import fs from 'node:fs';

class Database {
	public _path: string;
	public _content: Array<string>;
	constructor(fileName: string) {
		this._path = `./databases/${fileName}.json`;
		this._content = [];
	}
	add(data: string) {
		this._content.push(data);
		fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2));
	}
	remove(data: string) {
		this._content = this._content.filter(x => x !== data);
		fs.writeFileSync(this._path, JSON.stringify(this._content, null, 2));
	}
	initLoad = () => this._content = JSON.parse(fs.readFileSync(this._path, 'utf8'));
}

export class bannedWords extends Database { constructor() { super('bannedWords') } };

export class TFlist extends Database { constructor() { super('TFlist') } };

export class FMlist extends Database { constructor() { super('FMlist') } };