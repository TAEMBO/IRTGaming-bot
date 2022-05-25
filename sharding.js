const {token} = require("./config.json")
const {ShardingManager} = require("discord.js")
const sharder = new ShardingManager("./index.js", {token: token, totalShards: 1})
sharder.on("shardCreate", async (shard)=>{console.log(`Shard Created!`)})
sharder.spawn();