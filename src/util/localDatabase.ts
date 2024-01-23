import fs from "node:fs";
import path from "node:path";

/** A class for managing local JSON array files */
export class LocalDatabase<T> {
    /** The path for this LocalDatabase's JSON file */
    private readonly _path: string;
    /** The content for this LocalDatabase */
    public readonly data: T[];

    constructor(fileName: `${string}.json`) {
        this._path = path.resolve(`../databases/${fileName}`);
        this.data = JSON.parse(fs.readFileSync(this._path, 'utf8'));
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
    private save() {
        fs.writeFileSync(this._path, JSON.stringify(this.data, null, 4));

        return this;
    }
}