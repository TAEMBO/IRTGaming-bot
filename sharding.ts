import tokens from './tokens.json' assert { type: 'json' };
import { ShardingManager } from 'discord.js';
const sharder = new ShardingManager('./index.js', { token: tokens.token, totalShards: 1 });
sharder.on("shardCreate", () => console.log('\x1b[32mShard started'));
sharder.spawn();