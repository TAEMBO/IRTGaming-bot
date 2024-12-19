import type { Client } from "discord.js";
import type { PlayerUsed } from "farming-simulator-types/2025";
import type{ WatchList } from "#schemas";
import { ADMIN_ICON, FM_ICON, TF_ICON, WL_ICON } from "./constants.js";

export function formatDecorators(client: Client, player: PlayerUsed, watchList?: WatchList["doc"][]) {
    let decorators = "";

    if (player.isAdmin) decorators += ADMIN_ICON;

    if (client.fmList.cache.includes(player.name)) decorators += FM_ICON;

    if (client.tfList.cache.includes(player.name)) decorators += TF_ICON;

    if (watchList) {
        if (watchList.some(x => x._id === player.name)) decorators += WL_ICON;

        if (client.whitelist.cache.includes(player.name)) decorators += ":white_circle:";
    }

    return decorators;
}