const { Client, Collection, Intents } = require("discord.js");
const {
  token,
} = require("./config.json");
const fs = require("fs");
const { refreshCommands } = require("./registercomms");
const { Verification } = require("./db_modules/verification");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  await refreshCommands();
  await Verification.deleteAll();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
	if(interaction.replied)
    await interaction.editReply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
	else await interaction.reply({
		content: "There was an error while executing this command!",
		ephemeral: true,
	  });
  }
});

client.login(token);
