import type { ClientEvents } from "discord.js";

export class Event<TEvent extends keyof ClientEvents> {
    /** The listener name of the event */
    readonly name: TEvent;
    /** Whether or not to use `once()` or `on()` */
    readonly once?: boolean;
    /** The function to be ran when this event is emitted */
    readonly run: (...args: ClientEvents[TEvent]) => Promise<any>;

    constructor(eventData: {
        name: TEvent;
        once?: boolean;
        run: (...args: ClientEvents[TEvent]) => Promise<any>;
    }) {
        this.name = eventData.name;
        this.run = eventData.run;

        if (eventData.once) this.once = eventData.once;
    }
}