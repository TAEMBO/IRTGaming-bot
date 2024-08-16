import type { ChatInputCommandInteraction } from "discord.js";
import { ERR_TEXT, log } from "#util";

export async function handleChatInputCommand(interaction: ChatInputCommandInteraction<"cached">) {
    const subCmd = interaction.options.getSubcommand(false);
    const command = interaction.client.chatInputCommands.get(interaction.commandName);

    if (!command) {
        await interaction.reply(ERR_TEXT);
        return log("Red", `ChatInput - missing command: /${interaction.commandName}`);
    }

    log(
        "White",
        `\x1b[32m${interaction.user.tag}\x1b[37m used \x1b[32m/${interaction.commandName} ${subCmd ?? ""}\x1b[37m in \x1b[32m#${interaction.channel!.name}`,
    );

    if (!interaction.client.config.toggles.commands && !interaction.client.config.devWhitelist.includes(interaction.user.id))
        return await interaction.reply("Commands are currently disabled.");

    try {
        await command.run(interaction);
        command.uses++;
    } catch (err: any) {
        await interaction.client.errorLog(err);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(ERR_TEXT);
        } else {
            await interaction.reply(ERR_TEXT);
        }
    }
}
