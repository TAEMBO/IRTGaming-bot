import type { Model } from "mongoose";

export abstract class BaseSchema<T extends Model<any, {}, {}, {}>> {
    public readonly doc = this.data.hydrate({}) as ReturnType<T["hydrate"]>;
    public readonly obj = this.data.castObject({}) as ReturnType<T["castObject"]>;

    public constructor(public readonly data: T) { }
}

export abstract class BaseCachedSchema<
    TSchema extends Model<{ _id: any }, {}, {}, any, any>,
    TSchemaEntry = ReturnType<TSchema["castObject"]>["_id"]
> extends BaseSchema<TSchema> {
    public readonly cache: TSchemaEntry[] = [];

    public async add(id: TSchemaEntry) {
        const doc = await this.data.create({ _id: id });

        this.cache.push(doc._id);

        return this;
    }

    public async remove(id: TSchemaEntry) {
        const doc = await this.data.findByIdAndDelete(id);

        if (!doc) return null;

        this.cache.splice(this.cache.indexOf(doc._id), 1);

        return this;
    }

    public async fillCache() {
        const docs = await this.data.find();

        Reflect.set(this, "cache", docs.map(x => x._id));

        return this;
    }
}
