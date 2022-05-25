const { SlashCommandBuilder } = require("@discordjs/builders");
const path = require("path");

module.exports = { 
    run: async (client, interaction) => {
        const fs = require('node:fs')

        let arr = require('../databases/FMstaff.json')
        
        function removeCustomValue(array, value){
            for(let i = 0; i < array.length; i++){
                if(array[i].includes(value)){
                    array.splice(i, 1)
                    break;
                }
            }
            return array;
        }
        
        console.log(arr)
        
        arr = removeCustomValue(arr, "Nebs")
        
        console.log(arr)
        fs.writeFileSync(path.resolve('./databases/FMstaff.json'), JSON.stringify(arr))

        interaction.reply("Successfully removed ")
    },
    data: new SlashCommandBuilder().setName("test").setDescription("test")
};