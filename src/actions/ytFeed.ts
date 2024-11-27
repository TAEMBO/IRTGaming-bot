import type { Client } from "discord.js";
import { createHmac } from "node:crypto";
import { URLSearchParams } from "node:url";
import type { Request } from "express-serve-static-core";
import cron from "node-cron";
import polka from "polka";
import { formatTime, jsonFromXML, log } from "#util";
import type { YTFeedData } from "#typings";

async function parseBody(req: Request) {
    let data = "";

    for await (const chunk of req) data += chunk;

    return data;
}

export function ytFeed(client: Client) {
    const server = polka();

    server.get("/", (req, res) => {
        if (
            !req.query["hub.topic"] ||
            !req.query["hub.mode"] ||
            !req.query["hub.challenge"] ||
            typeof req.query["hub.lease_seconds"] !== "string"
        ) {
            log("Yellow", "YTFeed invalid GET");

            return void res.writeHead(400).end();
        }

        const leaseTime = formatTime(parseInt(req.query["hub.lease_seconds"], 10) * 1_000, 5);

        log("Green", `YTFeed valid GET with ${leaseTime} lease time, echoing`);

        res.writeHead(200).end(req.query["hub.challenge"]);
    });

    server.post("/", async (req, res) => {
        const rawBody = await parseBody(req);
        const signatureHeader = req.headers["x-hub-signature"];

        if (!signatureHeader || Array.isArray(signatureHeader)) {
            log("Yellow", "YTFeed invalid header");

            return void res.writeHead(403).end();
        }

        const [algo, signature] = signatureHeader.split("=");
        let hmac;

        try {
            hmac = createHmac(algo, client.config.ytFeed.secret);
        } catch (e) {
            log("Yellow", "YTFeed invalid sig");

            return void res.writeHead(403).end();
        }

        if (hmac.update(rawBody).digest("hex").toLowerCase() !== signature) {
            log("Yellow", "YTFeed mismatched sig");

            return void res.writeHead(403).end();
        }

        res.writeHead(200).end();

        const data = jsonFromXML<YTFeedData>(rawBody);
        const videoId = data.feed.entry["yt:videoId"]._text;
        const publishUnix = new Date(data.feed.entry.published._text).getTime();

        if ((Date.now() - publishUnix) > 300_000) {
            log("Yellow", `Skipped ${videoId}; age over 5 minutes`);
        } else if (client.ytCache.has(videoId)) {
            log("Yellow", `Skipped ${videoId}; already cached`);
        } else {
            client.ytCache.add(videoId);

            setTimeout(() => client.ytCache.delete(videoId), 300_000);

            await client.getChan("videosAndLiveStreams").send(
                `**${data.feed.entry.author.name._text}** just posted a new video!\n` +
                data.feed.entry.link._attributes.href
            );
        }
    });

    server.listen(client.config.ytFeed.port, () => log("Purple", "YTFeed listening on port", client.config.ytFeed.port));

    cron.schedule("0 0 * * WED", async () => {
        const body = new URLSearchParams({
            "hub.callback": client.config.ytFeed.callback,
            "hub.verify": "sync",
            "hub.mode": "subscribe",
            "hub.secret": client.config.ytFeed.secret,
            "hub.lease_seconds": "864000"
        });

        for (const channelId of client.config.ytFeed.channelIds) {
            body.set("hub.topic", "https://www.youtube.com/xml/feeds/videos.xml?channel_id=" + channelId);

            const res = await fetch("https://pubsubhubbub.appspot.com/subscribe", { method: "POST", body });

            log("Yellow", `YTFeed lease renew for ${channelId}:`, res.status);
        }
    }, { timezone: "UTC", runOnInit: true });
}