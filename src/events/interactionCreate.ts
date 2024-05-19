import { Events } from "discord.js";
import * as Handlers from "../interactions/index.js";
import { Event } from "../structures/index.js";

export default new Event({
    name: Events.InteractionCreate,
    async run(interaction) {
        if (!interaction.inCachedGuild()) return;

        if (interaction.isChatInputCommand()) {
            await Handlers.handleChatInputCommand(interaction);
        } else if (interaction.isContextMenuCommand()) {
            await Handlers.handleContextMenuCommand(interaction);
        } else if (interaction.isButton()) {
            await Handlers.handleButton(interaction);
        } else if (interaction.isAutocomplete()) {
            await Handlers.handleAutocomplete(interaction);
        }
    }
});