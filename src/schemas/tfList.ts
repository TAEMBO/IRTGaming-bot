
import mongoose from "mongoose";
import { BaseCachedSchema } from "#structures";

const model = mongoose.model("tfList", new mongoose.Schema({
    _id: { type: String, required: true },
}, { versionKey: false }));

export class TFList extends BaseCachedSchema<typeof model> {
    public constructor() {
        super(model);
    }
}
