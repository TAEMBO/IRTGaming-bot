import mongoose from "mongoose";
import { Cached } from "src/typings.js";

const model = mongoose.model("tfList", new mongoose.Schema({
    _id: { type: String, required: true },
}, { versionKey: false }));

export type TFListDocument = ReturnType<typeof model.castObject>;

export class TFList implements Cached<TFListDocument["_id"]> {
    public data = model;
    public cache: TFListDocument["_id"][] = [];
    
    public constructor() { }

    public async add(word: TFListDocument["_id"]) {
        const doc = await this.data.create({ _id: word });
        
        this.cache.push(doc._id);

        return this;
    }

    public async remove(word: TFListDocument["_id"]) {
        const doc = await this.data.findByIdAndDelete(word);

        if (!doc) return null;
        
        this.cache.splice(this.cache.indexOf(doc._id), 1);

        return this;
    }

    public async fillCache() {
        const doc = await this.data.find();

        this.cache = doc.map(x => x._id);

        return this;
    }
}