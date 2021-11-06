const { FaceitHub } = require("../faceit_consumer/hub");
const {
  hubId,
  hubAutomationUpdateTime,
} = require("../config.json");
const { FaceitMatch } = require("../faceit_consumer/match");
const { updateLocale } = require("moment");
const { MessageEmbed } = require("discord.js");

class HubThread {
  static logtag = "[HUB]";
  static hub = null;
  static matches = [];
  static status = 0; //0 stop | 1 start | -1 error
  static interval;

  static clear() {}

  static async start(interaction) {
    if (HubThread.status != 1) {
      await HubThread.refreshChannels(interaction);
      HubThread.hub = await FaceitHub.getHubByID(hubId);
      HubThread.startInterval(interaction);
      HubThread.status = 1;
      return 1;
    } else {
      return -1;
    }
  }

  static async refreshChannels(interaction){
    var channels = interaction.guild.channels.cache.values();
    for(const channel of channels){
      if(channel.name.includes("match-log") || channel.name.includes("VS") || channel.name.includes("team")){
        await channel.delete();
      }
    }
  }

  static startInterval(interaction) {
    HubThread.interval = setInterval(async function () {
      var matches = await HubThread.hub.getMatches("ongoing", 0, 100);

      matches = matches.filter(function (match) { //removing matches with thread
        return HubThread.matches.indexOf(match.match_id) < 0;
      });
      
      for (var i in matches) {
        await HubThread.startMatchThread(matches[i],interaction);
      }
    }, hubAutomationUpdateTime);
  }


  static async startMatchThread(match,interaction){
    console.log("NEW MATCH");
    console.log(match);
    var team_a = match.teams.faction1;
    var team_b = match.teams.faction2;
    var names_unavailable = (match.status == "CHECK_IN " || match.status == "VOTING") ? true : false;
    var category = await interaction.guild.channels.create((names_unavailable ? "Team_A" : team_a.name) + " VS " + (names_unavailable ? "Team_B": team_b.name), {type: "GUILD_CATEGORY"});
    var team_a_channel = await interaction.guild.channels.create(names_unavailable ? "Team_A": team_a.name, {type: "GUILD_VOICE", parent: category});
    var team_b_channel = await interaction.guild.channels.create(names_unavailable ? "Team_B": team_b.name, {type: "GUILD_VOICE", parent: category});
    var matchlog_channel = await interaction.guild.channels.create("MATCH LOG", {type: "GUILD_TEXT", parent: category});
    switch(match.status){
      case "CHECK_IN":
      case "READY":
        matchlog_channel.send({ embeds: [new MessageEmbed()
          .setColor('#ff5722')
          .setTitle("--[MATCH LOG]--")
          .setDescription("Match starting up... players are invited to join the server.")]});
    }
    HubThread.matches.push(match.match_id);
    var result1;
    var result2;
    var prevResult1 = " ";
    var prevResult2 = " ";
    var checkInterval = setInterval(async function () {
      console.log(match);
      match = await FaceitMatch.getMatchByID(match.match_id);
      names_unavailable = match.status == "CHECK_IN " || match.status == "VOTING" ? true : false;
      if(match.status == "FINISHED" || match.status == "CANCELLED"){
        await category.delete();
        await matchlog_channel.delete();
        await team_a_channel.delete();
        await team_b_channel.delete();
        HubThread.matches.splice(HubThread.matches.indexOf(match.match_id),1);
        clearInterval(checkInterval);
        //clearInterval(moveInterval);
        return;
      }
      result1 = match.results == undefined ? " " : match.results.score.faction1; //updating result
      result2 = match.results == undefined ? " " : match.results.score.faction2;
      await team_a_channel.setName(result1 + " | " + (names_unavailable ? "Team_A": team_a.name));
      await team_b_channel.setName(result2 + " | " + (names_unavailable ? "Team_B": team_b.name));
      if(prevResult1 != result1 || prevResult2 != result2){
        var teamWonRound = result1 > prevResult1 ? team_a : team_b;
        await HubThread.updateMatchLog(match,matchlog_channel,teamWonRound,team_a,team_b,result1,result2);
      }
      prevResult1 = result1;
      prevResult2 = result2;
    }, 5000);
  }

  static async stop(interaction) {
    if (HubThread.status != 0) {
      clearInterval(HubThread.interval);
      await HubThread.refreshChannels(interaction);
      HubThread.interval = 0;
      HubThread.status = 0;
      return 1;
    }
    return 0;
  }

  static async updateMatchLog(match,channel,teamWon,team_a,team_b,result1,result2){
    var message = new MessageEmbed()
	  .setColor('#ff5722')
	  .setTitle("--[MATCH LOG]--")
    .setDescription("**" + teamWon.name + "**" + " won a round.")
    .setURL(match.faceit_url)
	  .setThumbnail(teamWon.avatar)
    .setTimestamp()
 	  .addFields(
      { name: 'New Result:',value: "\u200B"},
      { name: team_a.name, value: result1.toString(), inline: true},
      { name: "VS", value: "\u200B", inline: true},
		  { name: team_b.name, value: result2.toString(), inline: true},
      { name: '\u200B', value: '\u200B'},
		  { name: 'match-id', value: match.match_id},
		  { name: 'region', value: match.region},
    );
    channel.send({ embeds: [message] });
  }
}

module.exports = { HubThread };
