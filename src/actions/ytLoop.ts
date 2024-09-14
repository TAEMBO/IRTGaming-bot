import type { Client } from "discord.js";
import { log, formatRequestInit, jsonFromXML } from "#util";
import type { YTCacheFeed } from "#typings";

export async function ytLoop(this: Client) {
    for (const channel of this.config.ytChannels) {
        if (this.config.toggles.debug) log("Yellow", "YTLoop", channel.name);

        const res = await fetch(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
            formatRequestInit(5_000, "YTLoop")
        ).catch(() => log("Red", `${channel.name} YT fetch fail`));
        let data;

        if (!res) continue;

        try {
            data = jsonFromXML<YTCacheFeed>(await res.text());
        } catch (err) {
            log("Red", `${channel.name} YT parse fail`);
            continue;
        }

        const latestVid = data.feed.entry[0];

        if (!this.ytCache[channel.id]) {
            this.ytCache[channel.id] = latestVid["yt:videoId"]._text;
            continue;
        }

        if (data.feed.entry[1]["yt:videoId"]._text !== this.ytCache[channel.id]) continue;

        this.ytCache[channel.id] = latestVid["yt:videoId"]._text;
        await this.getChan("videosAndLiveStreams").send(`**${channel.name}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
    }
}
