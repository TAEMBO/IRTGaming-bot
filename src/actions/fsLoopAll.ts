import { EmbedBuilder } from "discord.js";
import type TClient from "../client.js";
import { log } from "#util";

export async function fsLoopAll(client: TClient, watchList: TClient["watchList"]["doc"][]) {
    const embed = new EmbedBuilder().setColor(client.config.EMBED_COLOR);
    const pausedStatuses: (boolean | null)[] = [];
    const totalCount: number[] = [];

    for (const [serverAcro, server] of Object.entries(client.fsCache)) {
        const playerInfo: string[] = [];
        const serverSlots = server.players.length;

        totalCount.push(serverSlots);
        pausedStatuses.push(server.throttled);

        for (const player of server.players) {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
            let decorators = player.isAdmin ? ":detective:" : ""; // Tag for if player is admin
            
            decorators += client.fmList.cache.includes(player.name) ? ":farmer:" : ""; // Tag for if player is FM
            decorators += client.tfList.cache.includes(player.name) ? ":angel:" : ""; // Tag for if player is TF
            decorators += client.whitelist.cache.includes(player.name) ? ":white_circle:" : ""; // Tag for if player is on whitelist
            decorators += watchList.some(x => x._id === player.name) ? ":no_entry:" : ""; // Tag for if player is on watchList

            playerInfo.push(`\`${player.name.slice(0, 46)}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
        }
        
        if (playerInfo.length) embed.addFields({ name: `${serverAcro.toUpperCase()} - ${serverSlots}/16`, value: playerInfo.join("\n") });
    }

    // Throttle message updating if no changes in cached data
    if (pausedStatuses.every(x => x)) return;

    await client.getChan("juniorAdminChat").messages.edit(client.config.mainServer.fsLoopMsgId, {
        content: `\`\`\`js\n["${client.whitelist.cache.join(", ")}"]\`\`\`Updates every 30 seconds`,
        embeds: [embed.setTitle(totalCount.reduce((a, b) => a + b, 0) + " online")]
    }).catch(() => log("Red", "FSLoopAll invalid msg"));
}