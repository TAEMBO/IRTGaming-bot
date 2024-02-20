import { ShardingManager } from "discord.js";
import { log } from "./util/index.js";

const sharder = new ShardingManager("./index.js", { totalShards: 1 });

sharder.on("shardCreate", () => log("Green", "Shard started"));
sharder.spawn();