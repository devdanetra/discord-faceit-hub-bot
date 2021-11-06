const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const { clear } = require("console");
const { Verification } = require("../db_modules/verification");
const { FaceitPlayer } = require("../faceit_consumer/player");
const { SteamUser } = require("../steam_consumer/user");
const moment = require("moment");
const { DBUser } = require("../db_modules/users");
const { CSGOstats } = require("../faceit_consumer/csgo_stats");
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fstats")
    .setDescription("Get your profile stats, or check others'.")
    .setDefaultPermission(true)
    .addStringOption((option) =>
      option
        .setName("faceit_nickname")
        .setDescription("Enter a Faceit Nickname (CAPS sensitive)")
    ),

  async execute(interaction) {
    if (interaction.options.data.length == 0)
        return await sendOwnStats(interaction);
    else
        return await sendPlayerStats(interaction,interaction.options.getString("faceit_nickname"));
  },
};



async function sendOwnStats(interaction){

    var database_user = await DBUser.getByDiscordId(interaction.member.id);
    if(database_user == undefined)
      return interaction.reply(
      "Please sync your faceit account first (!fsync <faceit_nickname>)"
        );

    var faceitPlayer = await FaceitPlayer.getPlayerByID(database_user.faceitId);

    var message = await buildStatsMessage(faceitPlayer);
    console.log("B");
    console.log(message);
    return interaction.reply({ embeds: [message] });
}



async function buildStatsMessage(faceitPlayer){
  var csgo = await CSGOstats.getById(faceitPlayer.player_id);
  console.log(csgo.lifetime["K/D Ratio"]);
  var title = `${faceitPlayer.nickname} | [${faceitPlayer.country}]`;
  var message = new MessageEmbed()
	.setColor('#ff5722')
	.setTitle(title)
	.setURL(faceitPlayer.faceit_url)
	.setThumbnail(faceitPlayer.avatar)
 	.addFields(
		{ name: 'Level', value: faceitPlayer.games.csgo.skill_level.toString(),},
		{ name: 'ELO', value: faceitPlayer.games.csgo.faceit_elo.toString(),},
    { name: '\u200B', value: '\u200B' },
    { name: 'Total Matches', value: csgo.lifetime.Matches.toString(), inline: true },
    { name: 'Recent Results', value: csgo.lifetime["Recent Results"].toString(), inline: true },
    { name: 'Average Headshots %', value: csgo.lifetime["Average Headshots %"], inline: true },
   );
  console.log(message);
  return message;
}