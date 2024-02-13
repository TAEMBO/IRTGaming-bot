import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";
import type { CombinedSlashCommandBuilder } from "../typings.js";

/**
 * Creates a new instance of an application command
 */
export class Command<
    T extends "chatInput" | "message" | "user",
    D = T extends "chatInput"
        ? CombinedSlashCommandBuilder
        : ContextMenuCommandBuilder,
    I = T extends "chatInput"
        ? ChatInputCommandInteraction<"cached">
        : T extends "message"
            ? MessageContextMenuCommandInteraction<"cached">
            : UserContextMenuCommandInteraction<"cached">,
    A = T extends "chatInput"
        ? ((interaction: AutocompleteInteraction<"cached">) => Promise<any>)
        : undefined
> {
    /** The optional autocomplete function that is ran for this command */
    autocomplete?: A;
    /** The function that is ran for this command */
    run: (interaction: I) => Promise<any>;
    /** The builder data for this command */
    readonly data: D;
    /** The amount of times this command has been used */
    uses = 0;

    constructor(commandData: (
        {
            readonly data: D;
            run(interaction: I): Promise<any>;
        } & (T extends "chatInput"
            ? { autocomplete?: A }
            : Record<string, any>
        )
    )) {
        this.autocomplete = (commandData as (typeof commandData & { autocomplete: A })).autocomplete;
        this.run = commandData.run;
        this.data = commandData.data;

        if (!this.autocomplete) delete this.autocomplete;
    }
}