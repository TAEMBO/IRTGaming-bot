import fs from 'node:fs';
import path from 'node:path';

/** A class for managing local JSON array files */
export class LocalDatabase<T> {
    /** The path for this LocalDatabase's JSON file */
    public _path: string;
    /** The content for this LocalDatabase */
    public data: T[] = [];
    constructor(fileName: string) {
        this._path = path.resolve(`../databases/${fileName}.json`);
    }
    /** Loads the data from the JSON file */
    public initLoad() {
        const ingestedCon = JSON.parse(fs.readFileSync(this._path, 'utf8'));

        if (!Array.isArray(ingestedCon)) throw new Error(`LocalDatabase "${this._path}", content does not equal Array`)

        this.data = ingestedCon;

        return this.data;
    }
    /** Adds an element to the array and saves the data to JSON */
    public add(data: T) {
        this.data.push(data);
        this.save();

        return this;
    }
    /** Removes an element from the array and saves the data to JSON */
    public remove(data: T) {
        this.data.splice(this.data.indexOf(data), 1);
        this.save();

        return this;
    }
    /** Saves the data to JSON */
    public save() {
        fs.writeFileSync(this._path, JSON.stringify(this.data, null, 4));

        return this;
    }
}