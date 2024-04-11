import fs from "node:fs";
import path from "node:path";

/** A class for managing local JSON files */
export class LocalStorage<TElement> {
    /** The path for this instance's JSON file */
    private readonly _path: string;
    /** The content for this instance */
    public readonly data: TElement[];

    public constructor(fileName: `${string}.json`) {
        this._path = path.resolve(`../databases/${fileName}`);
        this.data = JSON.parse(fs.readFileSync(this._path, "utf8"));

        if (!Array.isArray(this.data)) throw new Error(`LocalStorage not array: ${fileName}`);
    }

    /** Adds an element to the array and saves the data to JSON */
    public add(data: TElement) {
        this.data.push(data);
        this.save();

        return this;
    }

    /** Removes an element from the array and saves the data to JSON */
    public remove(data: TElement) {
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