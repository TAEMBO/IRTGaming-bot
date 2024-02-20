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
    TCommand extends "chatInput" | "message" | "user",
    TBuilder = TCommand extends "chatInput"
        ? CombinedSlashCommandBuilder
        : ContextMenuCommandBuilder,
    TInteraction = TCommand extends "chatInput"
        ? ChatInputCommandInteraction<"cached">
        : TCommand extends "message"
            ? MessageContextMenuCommandInteraction<"cached">
            : UserContextMenuCommandInteraction<"cached">,
    TAutocomplete = TCommand extends "chatInput"
        ? ((interaction: AutocompleteInteraction<"cached">) => Promise<any>)
        : undefined
> {
    /** The optional autocomplete function that is ran for this command */
    autocomplete?: TAutocomplete;
    /** The function that is ran for this command */
    run: (interaction: TInteraction) => Promise<any>;
    /** The builder data for this command */
    readonly data: TBuilder;
    /** The amount of times this command has been used */
    uses = 0;

    constructor(commandData: (
        {
            readonly data: TBuilder;
            run(interaction: TInteraction): Promise<any>;
        } & (TCommand extends "chatInput"
            ? { autocomplete?: TAutocomplete }
            : Record<string, any>
        )
    )) {
        this.autocomplete = (commandData as (typeof commandData & { autocomplete: TAutocomplete })).autocomplete;
        this.run = commandData.run;
        this.data = commandData.data;

        if (!this.autocomplete) delete this.autocomplete;
    }
}