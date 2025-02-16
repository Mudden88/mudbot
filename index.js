const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");
const client = require("./client/client.js");
const getFunctions = require("./functions/functions.js");

client.commands = new Collection(); // Initialize commands collection

// Dynamically load all commands from the commands folder
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

getFunctions(client);

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error executing this command!", ephemeral: true });
    }
});

client.login(process.env.TOKEN);
