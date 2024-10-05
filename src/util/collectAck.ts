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
    const msg = interaction.isCommand()
        ? await interaction.reply({ ...payload, fetchReply: true, components: ACK_BUTTONS })
        : await interaction.update({ ...payload, fetchReply: true, components: ACK_BUTTONS });
    let collected;
    let state: "cancel" | "confirm";

    try {
        collected = await msg.awaitMessageComponent({
            time,
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
        });
    } catch (err) {
        if (rejection) await rejection();

        return { msg, state: "rejection" };
    }

    if (collected.customId === "confirm") {
        state = "confirm";

        await confirm(collected);
    } else {
        state = "cancel";

        await cancel(collected);
    }

    return { msg, state };
}
