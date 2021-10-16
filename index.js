const { Client, Intents } = require("discord.js");
const { token, clientId, guildId } = require("./config.json");
const { FaceitPlayer } = require("./faceit_consumer/player");
const { FaceitHub } = require("./faceit_consumer/hub");
const { FaceitMatch } = require("./faceit_consumer/match");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", async () => {
  await FaceitPlayer.getPlayerByNick("Marcy5454");
  var hub = await FaceitHub.getHubByID("ffc6b5f4-6a74-41c6-b553-931847771335");
  await hub.getMatches("all", 0, 10);
  var match = FaceitMatch.getMatchByID("1-c8d9f685-39cb-4bf4-92d9-e75b268f8757");
});

client.login(token);
