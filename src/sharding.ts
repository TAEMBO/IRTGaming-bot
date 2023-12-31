import { ShardingManager } from 'discord.js';
import { log } from './utils.js';

const sharder = new ShardingManager('./index.js', { totalShards: 1 });

sharder.on("shardCreate", () => log('Green', 'Shard started'));
sharder.spawn();