import type { ClientEvents } from "discord.js";

export class Event<TEvent extends keyof ClientEvents> {
    /** The listener name of the event */
    public readonly name: TEvent;
    /** Whether or not to use `once()` or `on()` */
    public readonly once?: boolean;
    /** The function to be ran when this event is emitted */
    public readonly run: (...args: ClientEvents[TEvent]) => Promise<any>;

    public constructor(eventData: {
        name: TEvent;
        once?: boolean;
        run: (...args: ClientEvents[TEvent]) => Promise<any>;
    }) {
        this.name = eventData.name;
        this.run = eventData.run;

        if (eventData.once) this.once = eventData.once;
    }
}