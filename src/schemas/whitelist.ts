import mongoose from "mongoose";
import type { Cached } from "#typings";

const model = mongoose.model(
    "whitelist",
    new mongoose.Schema(
        {
            _id: { type: String, required: true },
        },
        { versionKey: false },
    ),
);

export type WhitelistDocument = ReturnType<typeof model.castObject>;

export class Whitelist implements Cached<WhitelistDocument["_id"]> {
    public data = model;
    public cache: WhitelistDocument["_id"][] = [];

    public constructor() {}

    public async add(word: WhitelistDocument["_id"]) {
        const doc = await this.data.create({ _id: word });

        this.cache.push(doc._id);

        return this;
    }

    public async remove(word: WhitelistDocument["_id"]) {
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
