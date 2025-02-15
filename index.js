const client = require("./client/client.js");
const registerFunctions = require("./functions/functions.js");

registerFunctions(client);

client.login(process.env.TOKEN);