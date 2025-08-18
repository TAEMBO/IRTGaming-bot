import {
    type ButtonInteraction,
    type CommandInteraction,
    type InteractionReplyOptions,
    type InteractionUpdateOptions,
    type Message,
    type MessageComponentInteraction,
    ComponentType,
} from "discord.js";
import { ACK_BUTTONS } from "./index.js";

/**
 * Creates and point for and collects a confirm/cancel button acknowledgement
 */
export async function collectAck({
    payload,
    interaction,
    time = 30_000,
    confirm,
    cancel,
    rejection,
}: {
    interaction: CommandInteraction<"cached"> | MessageComponentInteraction<"cached">
    payload: InteractionReplyOptions & InteractionUpdateOptions;
    time?: number;
    confirm: (int: ButtonInteraction<"cached">) => Promise<any>;
    cancel: (int: ButtonInteraction<"cached">) => Promise<any>;
    rejection?: () => Promise<any>;
}): Promise<{ msg: Message<true>; state: "cancel" | "confirm" | "rejection" }> {
    const response = interaction.isCommand()
        ? await interaction.reply({ ...payload, withResponse: true, components: ACK_BUTTONS })
        : await interaction.update({ ...payload, withResponse: true, components: ACK_BUTTONS });
    let collected;
    let state: "cancel" | "confirm";

    try {
        collected = await response.resource!.message!.awaitMessageComponent({
            time,
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
        });
    } catch (err) {
        if (rejection) await rejection();

        // TODO: Remove upon d.js v14.22 release
        // @ts-expect-error d.js typings issue
        return { msg: response.resource!.message!, state: "rejection" };
    }

    if (collected.customId === "confirm") {
        state = "confirm";

        // @ts-expect-error d.js typings issue
        await confirm(collected);
    } else {
        state = "cancel";

        // @ts-expect-error d.js typings issue
        await cancel(collected);
    }

    // @ts-expect-error d.js typings issue
    return { msg: response.resource!.message!, state };
}
