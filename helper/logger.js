const { Client, Collection, Intents } = require("discord.js");
const { logChannelId } = require("../config.json");


function logChannel(client) {
  return client.channels.cache.get(logChannelId);
}

module.exports = { logChannel };
