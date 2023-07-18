import YClient from '../client.js';
import { log } from '../utilities.js';
import { LogColor, YTCacheFeed } from '../typings.js';
import { xml2js } from 'xml-js';

/**
 * Fetch a given YouTube channel's latest video and send an upload notification
 * @param client 
 * @param YTChannelID The ID of the given YouTube channel
 * @param YTChannelName The name of the given YouTube Channel
 */
export async function YTLoop(client: YClient, YTChannelID: string, YTChannelName: string) {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YTChannelID}`, {
        signal: AbortSignal.timeout(5000)
    }).catch(() => log(LogColor.Red, `${YTChannelName} YT fail`));

    if (!res) return;

    const Data = xml2js(await res.text(), { compact: true }) as YTCacheFeed;
    const latestVid = Data.feed.entry[0];

    if (!client.YTCache[YTChannelID]) return client.YTCache[YTChannelID] = latestVid['yt:videoId']._text;

    if (Data.feed.entry[1]['yt:videoId']._text === client.YTCache[YTChannelID]) {
        client.YTCache[YTChannelID] = latestVid['yt:videoId']._text;
        client.getChan('videosAndLiveStreams').send(`**${YTChannelName}** just uploaded a new video!\n${latestVid.link._attributes.href}`);
    }
}