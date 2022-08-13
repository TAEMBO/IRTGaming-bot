
![banner](https://images-ext-1.discordapp.net/external/wt5QNFDTrF5DHZTNdjCnt9Bmiv--6BhLVkuRdYXEwqQ/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/485793265568841728/3d955ae8ed32bde1a81aa12b7efcd5a5.png?width=230&height=230)

The 3rd generation single server discord bot developed and manained by TÆMBØ#5512 with who developed the majority of the bot annihilator#6516.

This bot is actually used in the [IRT gaming server](discord.gg/IRTGaming)

If you already know how to run the bot and have JavaScript knowledge you can jump to [Run the command](https://github.com/TAEMBO/IRTGaming-bot/main/README.md?plain=138)

# pre-requisites

- You need [NodeJS v16](https://nodejs.org/dist/v16.16.0/)
- And Windows [build tools for C++](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&ved=2ahUKEwjfoK36gp_5AhUr5IUKHUSABBQQFnoECAQQAQ&url=https%3A%2F%2Fgo.microsoft.com%2Ffwlink%2F%3FLinkId%3D691126&usg=AOvVaw0geDw_h-TSCfzTMvYE2ZOw) as some packages need it in the bot

# Downloading the bot and registering commands

To download the bot simply clone this repository or download it as a zip, fill the config as it works for you server and run `npm -i` command in your prefered console to install the packages in the bot folder, if it's the first time running the bot enable `botSwitches.registerCommands` in the [configuration](https://github.com/TAEMBO/IRTGaming-bot/main/README.md?plain=35]) of the bot.

# Dependencies

Here is the table with name and descriptions of every package in the bot, you can install by running `npm -i` as mentioned in [Downloading the bot](https://github.com/TAEMBO/IRTGaming-bot/main/README.md?plain=15)

|     Package name     |                                    Description                                   |
|:--------------------:|:--------------------------------------------------------------------------------:|
| @discord.js/builders | The discord.js dependency to register slash commands.                            |
| axios                | An HTTP client dependency.                                                       |
| canvas               | An image utility for some bot commands.                                          |
| discord.js           | This is the core library of the bot, an HTTP wrapper for the discord API.        |
| systeminformation    | A package used for retreiving host system technical information.                 |
| ms                   | Some time conversion utility.                                                    |

# Configuration

Since this bot is made for farming simulator, it has some server specified roles and channels, the configuration in this table is displayed dinamically

|        Config key       | Type     |                               Description                                  |
|:-----------------------:|----------|:--------------------------------------------------------------------------:|
| embedColor              | string   | Hex of the default embed color                                             |
| embedColorGreen         | string   | Hex of the green embed color                                               |
| embedColorRed           | string   | Hex of the red embed color                                                 |
| embedColorYellow        | string   | Hex of the yellow embed color                                              |
| botSwitches             | object   | The switches, each switch is self-descriptive                              |
| eval.allowed            | bool     | A JavaScript evaluation utility switch to enable or disable the command    |
| eval.whitelist          | string[] | RoleID's array that contain people who's allowed to run eval               |
| mainServer.id           | string   | The discord guild ID the bot will be on.                                   |
| mainServer.MPStaffRoles | string[] | MP Staff role names on the Discord server                                  |
| mainServer.staffRoles   | string[] | Staff role names on the Discord server                                     |
| roles                   | object   | The Discord server role IDs object, not added here, it would be too long   |
| channels                | object   | The Discord server channel IDs object, not added here, it would be too long|

The non specified objects are specified in the following codeblock for the JSON preview

```json
{
	"embedColor": "#06860a",
	"embedColorGreen": "#57f287",
	"embedColorRed": "#ed4245",
	"embedColorYellow": "#ffbd06",
	"botSwitches": {
		"commands": true,
		"automod": true,
		"logs": true,
		"registerCommands": true,
		"stats": true
	},
	"eval": {
		"allowed": true,
		"whitelist": ["0"]
	},
	"mainServer": {
		"id":"0",
		"MPStaffRoles": [
			"mpmanager",
			"mpadmin",
			"mppublicadmin",
			"mpfarmmanager"
		],
		"staffRoles": [
			"owner",
			"mod",
			"helper"
		],
		"roles": {
			"owner": "0",
			"admin": "0",
			"mod": "0",
			"helper": "0",
			"mpmanager": "0",
			"mpadmin": "0",
			"mppublicadmin": "0",
			"mpfarmmanager": "0",
			"trustedfarmer": "0",
			"mpstaff": "0",
			"mpmanagement": "0",
			"loa": "0",
			"mfmanager": "0",
			"mffarmowner": "0",
			"mfmember": "0",
			"mffarm1": "0",
			"mffarm2": "0",
			"mffarm3": "0",
			"mffarm4": "0",
			"mffarm5": "0",
			"mffarm6": "0",
			"mffarm7": "0",
			"mffarm8": "0",
			"mffarm9": "0",
			"mffarm10": "0",
      			"mffarm11": "0",
			"subscriber": "0"
		},
		"channels": {
			"modlogs": "0",
			"botcommands": "0",
			"fs22_silage": "0",
			"fs22_grain": "0",
			"welcome": "0",
			"testing_zone": "0",
			"suggestions": "0",
			"staffreports": "0",
			"fslogs": "0",
			"playercheck": "0",
			"watchlist": "0"
		}
	}
}
```

The json file should look like this, at least the key values.

This json doesn't support nullable values, so all should be filled, else the bot won't work

# Run the bot

If you skipped to this part that means you know what you are doing, it's still recommended you read the [configuration](https://github.com/TAEMBO/IRTGaming-bot/main/README.md?plain=35]) of the bot

To run the bot simply run the `RUN.bat` or run `node sharding.js` in any terminal
