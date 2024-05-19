import type { AutocompleteInteraction } from "discord.js";
import { log } from "../util/index.js";

export async function handleAutocomplete(interaction: AutocompleteInteraction<"cached">) {
    const command = interaction.client.chatInputCommands.get(interaction.commandName);
    
    if (!command) {
        await interaction.respond([]);
        return log("Red", `Autocomplete - missing command: ${interaction.commandName}`);
    }

    if (!command.autocomplete) {
        await interaction.respond([]);
        return log("Red", `Autocomplete - missing autocomplete function: ${interaction.commandName}`);
    }

    await command.autocomplete(interaction);
}