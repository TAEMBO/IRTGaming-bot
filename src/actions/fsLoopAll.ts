import { EmbedBuilder } from "discord.js";
import type TClient from "../client.js";
import { ADMIN_ICON, FM_ICON, TF_ICON, WL_ICON, log } from "#util";

export async function fsLoopAll(client: TClient, watchList: TClient["watchList"]["doc"][]) {
    const embed = new EmbedBuilder().setColor(client.config.EMBED_COLOR);
    const throttleList: (boolean | null)[] = [];
    const totalCount: number[] = [];
    const footerText: string[] = [];

    for (const [serverAcro, server] of Object.entries(client.fs22Cache)) {
        const playerInfo: string[] = [];
        const serverSlots = server.players.length;

        totalCount.push(serverSlots);
        throttleList.push(server.throttled);

        for (const player of server.players) {
            const playTimeHrs = Math.floor(player.uptime / 60);
            const playTimeMins = (player.uptime % 60).toString().padStart(2, "0");
            let decorators = player.isAdmin ? ADMIN_ICON : "";

            decorators += client.fmList.cache.includes(player.name) ? FM_ICON : "";
            decorators += client.tfList.cache.includes(player.name) ? TF_ICON : "";
            decorators += client.whitelist.cache.includes(player.name) ? ":white_circle:" : ""; // Tag for if player is on whitelist
            decorators += watchList.some(x => x._id === player.name) ? WL_ICON : "";

            playerInfo.push(`\`${player.name.slice(0, 46)}\` ${decorators} **|** ${playTimeHrs}:${playTimeMins}`);
        }

        if (playerInfo.length) embed.addFields({ name: `${serverAcro.toUpperCase()} - ${serverSlots}/16`, value: playerInfo.join("\n") });

        if (server.state === 0) footerText.push(`${serverAcro} offline`);
    }

    // Throttle message updating if no changes in API data on any servers
    if (throttleList.every(x => x)) return;

    if (footerText.length) embed.setFooter({ text: footerText.join(", ") });

    await client.getChan("juniorAdminChat").messages.edit(client.config.mainServer.fsLoopMsgId, {
        content: `\`\`\`js\n["${client.whitelist.cache.join(", ")}"]\`\`\`Updates every 30 seconds`,
        embeds: [embed.setTitle(totalCount.reduce((a, b) => a + b, 0) + " online")]
    }).catch(() => log("Red", "FSLoopAll invalid msg"));
}