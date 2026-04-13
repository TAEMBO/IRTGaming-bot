import type { CombinedContextMenuCommandInteraction } from "#typings";
import { styleText } from "node:util";
<<<<<<< HEAD
import { ERR_TEXT, log } from "#util";
=======
import { ERR_TEXT, getConfigErrorMessage, log } from "#util";
>>>>>>> e0ae159 (clean: config validation + crash fixes)

export async function handleContextMenuCommand(interaction: CombinedContextMenuCommandInteraction) {
    const command = interaction.client.contextMenuCommands.get(interaction.commandName);

    if (!command) {
        await interaction.reply(ERR_TEXT);
        return log("red", `ContextMenu - missing command: ${interaction.commandName}`);
    }

    log("white",
        styleText("green", interaction.user.tag) +
        " used " +
        styleText("green", interaction.commandName) +
        " in " +
        styleText("green", "#" + interaction.channel!.name)
    );

    if (
        !interaction.client.config.toggles.commands
        && !interaction.client.config.devWhitelist.includes(interaction.user.id)
    ) return await interaction.reply("Commands are currently disabled.");

    try {
        await command.run(interaction);
    } catch (err: any) {
        await interaction.client.errorLog(err);

<<<<<<< HEAD
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(ERR_TEXT);
        } else {
            await interaction.reply(ERR_TEXT);
        }
    }
}
=======
        const configErrorMessage = getConfigErrorMessage(err);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(configErrorMessage ?? ERR_TEXT);
        } else {
            await interaction.reply(configErrorMessage ?? ERR_TEXT);
        }
    }
}
>>>>>>> e0ae159 (clean: config validation + crash fixes)
