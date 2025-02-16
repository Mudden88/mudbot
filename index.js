const client = require("./client/client.js");
const getFunctions = require("./functions/functions.js");

getFunctions(client);

client.login(process.env.TOKEN);