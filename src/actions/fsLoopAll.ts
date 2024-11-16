import { EmbedBuilder } from "discord.js";
import type TClient from "../client.js";
import { ADMIN_ICON, FM_ICON, TF_ICON, WL_ICON, log } from "#util";

export async function fsLoopAll(client: TClient, watchList: TClient["watchList"]["doc"][]) {
    const fs22Embed = new EmbedBuilder().setColor("#2ac1ed");
    const fs25Embed = new EmbedBuilder().setColor("#a0c213");
    const throttleList: (boolean | null)[] = [];
    const totalCount22: number[] = [];
    const totalCount25: number[] = [];
    const footerText22: string[] = [];
    const footerText25: string[] = [];

    for (const [serverAcro, server] of Object.entries(client.fs22Cache)) {
        const playerInfo: string[] = [];
        const serverSlots = server.players.length;

        totalCount22.push(serverSlots);
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

        if (playerInfo.length) fs22Embed.addFields({
            name: `${serverAcro.toUpperCase()} - ${serverSlots}/16`,
            value: playerInfo.join("\n")
        });

        if (server.state === 0) footerText22.push(`${serverAcro.toUpperCase()} offline`);
    }

    for (const [serverAcro, server] of Object.entries(client.fs25Cache)) {
        const playerInfo: string[] = [];
        const serverSlots = server.players.length;

        totalCount25.push(serverSlots);
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

        if (playerInfo.length) fs25Embed.addFields({
            name: `${serverAcro.toUpperCase()} - ${serverSlots}/16`,
            value: playerInfo.join("\n")
        });

        if (server.state === 0) footerText25.push(`${serverAcro.toUpperCase()} offline`);
    }

    // Throttle message updating if no changes in API data on any servers
    if (throttleList.every(x => x)) return;

    if (footerText22.length) fs22Embed.setFooter({ text: footerText22.join(", ") });

    if (footerText25.length) fs25Embed.setFooter({ text: footerText25.join(", ") });

    await client.getChan("juniorAdminChat").messages.edit(client.config.mainServer.fsLoopMsgId, {
        content: `\`\`\`js\n["${client.whitelist.cache.join(", ")}"]\`\`\`Updates every 30 seconds`,
        embeds: [
            fs22Embed.setTitle(totalCount22.reduce((a, b) => a + b, 0) + " online"),
            fs25Embed.setTitle(totalCount25.reduce((a, b) => a + b, 0) + " online")
        ]
    }).catch(() => log("Red", "FSLoopAll invalid msg"));
}
