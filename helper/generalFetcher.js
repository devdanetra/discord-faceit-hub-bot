const { Client, Collection, Intents } = require("discord.js");
const { logChannelId, roleIDs, mainChannelId } = require("../config.json");


function logChannel(client) {
  return client.channels.cache.get(logChannelId);
}

function getAdminRole(guild){
  console.log(guild.roles.cache.get(roleIDs.admin));
  return guild.roles.cache.get(roleIDs.admin);
}

function getModRole(guild){
  return guild.roles.cache(roleIDs.mod);
}

function getUserRole(guild){
  return guild.roles.cache.get(roleIDs.user);
}

function getMainChannel(guild){
  return guild.channels.cache.get(mainChannelId);
}

module.exports = { logChannel, getAdminRole, getModRole, getUserRole, getMainChannel };
