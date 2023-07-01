import fs from 'node:fs';
import path from 'node:path';

/** A class for managing local JSON array files */
export default class localDatabase<T> {
    /** The path for this localDatabase's JSON file */
    public _path: string;
    /** The content for this localDatabase */
    public _content: T[] = [];
    constructor(fileName: string) {
        this._path = path.resolve(`../databases/${fileName}.json`);
    }
    /** Loads the data from the JSON file */
    public initLoad() {
        this._content = JSON.parse(fs.readFileSync(this._path, 'utf8'));

        return this._content;
    }
    /** Adds an element to the array and saves the data to JSON */
    public add(data: T) {
        this._content.push(data);
        this.save();

        return this;
    }
    /** Removes an element from the array and saves the data to JSON */
    public remove(data: T) {
        this._content.splice(this._content.indexOf(data), 1);
        this.save();

        return this;
    }
    /** Saves the data to JSON */
    public save() {
        fs.writeFileSync(this._path, JSON.stringify(this._content, null, 4));

        return this;
    }
}