const { FaceitHub } = require("../faceit_consumer/hub");
const { hubId, hubAutomationUpdateTime } = require("../config.json");
const { FaceitMatch } = require("../faceit_consumer/match");
const { updateLocale } = require("moment");
const { MessageEmbed } = require("discord.js");
const { DBUser } = require("../db_modules/users");
const { logChannel, getMainChannel } = require("../helper/generalFetcher");

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

  static async refreshChannels(interaction) {
    var channels = interaction.guild.channels.cache.values();
    for (const channel of channels) {
      if (
        channel.name.includes("match-log") ||
        channel.name.includes("VS") ||
        channel.name.includes("team")
      ) {
        await channel.delete();
      }
    }
  }

  static startInterval(interaction) {
    HubThread.interval = setInterval(async function () {
      var matches = await HubThread.hub.getMatches("ongoing", 0, 100);

      matches = matches.filter(function (match) {
        //removing matches with thread
        return HubThread.matches.indexOf(match.match_id) < 0;
      });

      for (var i in matches) {
        await HubThread.startMatchThread(matches[i], interaction);
      }
    }, hubAutomationUpdateTime);
  }

  static async startMatchThread(match, interaction) {
    var team_a = match.teams.faction1;
    var team_b = match.teams.faction2;
    var teams_unavailable =
      match.status == "CHECK_IN" ||
      match.status == "VOTING" ||
      match.status == "CONFIGURING";

    var category = await interaction.guild.channels.create( //creating channels
      (teams_unavailable ? "team_A" : team_a.name) +
        " VS " +
        (teams_unavailable ? "team_B" : team_b.name),
      { type: "GUILD_CATEGORY" }
    );
    var team_a_channel = await interaction.guild.channels.create(
      teams_unavailable ? "team_A" : team_a.name,
      { type: "GUILD_VOICE", parent: category }
    );
    await team_a_channel.permissionOverwrites.create(team_a_channel.guild.roles.everyone, { CONNECT : false });
    var team_b_channel = await interaction.guild.channels.create(
      teams_unavailable ? "team_B" : team_b.name,
      { type: "GUILD_VOICE", parent: category }
    );
    await team_b_channel.permissionOverwrites.create(team_b_channel.guild.roles.everyone, { CONNECT : false });
    var matchlog_channel = await interaction.guild.channels.create(
      "MATCH LOG",
      { type: "GUILD_TEXT", parent: category }
    );
    await matchlog_channel.permissionOverwrites.create(matchlog_channel.guild.roles.everyone, { SEND_MESSAGES : false });

    console.log(match.status);
    HubThread.matches.push(match.match_id); //adding to matches with thread going on

    var result1;
    var result2;
    var prevResult1 = 0;
    var prevResult2 = 0;
    var prevState = -1;

    var flag_check = true;
    var flag_move = true; //indicate first call;

    var moveInterval = setInterval(async function () {
      if (!teams_unavailable) {
      //  try {
          team_a = match.teams.faction1;
          team_b = match.teams.faction2;
          await HubThread.movePlayers(
            match,
            team_a,
            team_b,
            team_a_channel,
            team_b_channel,
            interaction,
            flag_move
          );
         flag_move = false;
        //} catch (e) {
        //  return logChannel(interaction.client).send({
        //    embeds: [
        //      new MessageEmbed()
        //        .setColor("#ff5722")
        //        .setTitle("[ADMIN ALERT | SCRIPT ERROR ]")
        //        .setDescription(e.toString()),
        //    ],
        //  });
        //}
      }
    }, 5000);

    var checkInterval = setInterval(async function () {
      console.log("STARTED LOOP");
      try {
        match = await FaceitMatch.getMatchByID(match.match_id);
        var team_a = match.teams.faction1;
        var team_b = match.teams.faction2;
        console.log(match.status);
        teams_unavailable =
          match.status == "CHECK_IN" ||
          match.status == "VOTING" ||
          match.status == "CONFIGURING";

          if(flag_check || prevState != match.status)
            switch (match.status) { //checking if match is starting now
              case "VOTING":
                await matchlog_channel.send({
                  embeds: [
                    new MessageEmbed()
                      .setColor("#ff5722")
                      .setTitle("--[MATCH LOG]--")
                      .setDescription(
                        "Voting maps..."
                      ),
                  ],
                });
                break;
              case "READY":
                await matchlog_channel.send({
                  embeds: [
                    new MessageEmbed()
                      .setColor("#ff5722")
                      .setTitle("--[MATCH LOG]--")
                      .setDescription(
                        "Match ready... players are invited to join the server."
                      ),
                  ],
                });
                await team_a_channel.setName(teams_unavailable ? "team_A" : team_a.name);
                await team_b_channel.setName(teams_unavailable ? "team_B" : team_b.name);
                await category.setName((teams_unavailable ? "team_A" : team_a.name) +
                " VS " +
                (teams_unavailable ? "team_B" : team_b.name));
                break;
              case "CONFIGURING":
                await matchlog_channel.send({
                  embeds: [
                    new MessageEmbed()
                      .setColor("#ff5722")
                      .setTitle("--[MATCH LOG]--")
                      .setDescription(
                        "Match configuring..."
                      ),
                  ],
                });
                break;
              case "ONGOING":
                await team_a_channel.setName(teams_unavailable ? "team_A" : team_a.name);
                await team_b_channel.setName(teams_unavailable ? "team_B" : team_b.name);
                await category.setName((teams_unavailable ? "team_A" : team_a.name) +
                " VS " +
                (teams_unavailable ? "team_B" : team_b.name));
                break;    
            }

        if (match.status == "FINISHED" || match.status == "CANCELLED") {
          clearInterval(checkInterval);
          clearInterval(moveInterval);
          console.log(matchlog_channel.id);
          console.log(team_a_channel.id);
          console.log(team_b_channel.id);
          console.log(category.id);
          await HubThread.deleteChannels(interaction,team_a_channel,team_b_channel,category,matchlog_channel);
          HubThread.matches.splice(
            HubThread.matches.indexOf(match.match_id),
            1
          );
          return;
        }

        result1 =
          match.results == undefined ? "0" : match.results.score.faction1; //updating result
        result2 =
          match.results == undefined ? "0" : match.results.score.faction2;
        if (prevResult1 != result1 || prevResult2 != result2) {
          console.log("CHANGED RESULT");
          var teamWonRound = result1 > prevResult1 ? team_a : team_b;
          await HubThread.updateMatchLog(
            interaction,
            match,
            matchlog_channel,
            teamWonRound,
            team_a,
            team_b,
            result1,
            result2,
            flag_check
          );
        }

        flag_check = false;
        prevResult1 = result1;
        prevResult2 = result2;
        prevState = match.status

      } catch (e) {
        return logChannel(interaction.client).send({
          embeds: [
            new MessageEmbed()
              .setColor("#ff5722")
              .setTitle("[ADMIN ALERT | SCRIPT ERROR ]")
              .setDescription(e.toString()),
          ],
        });
      }
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

  static async updateMatchLog(
    interaction,
    match,
    channel,
    teamWon,
    team_a,
    team_b,
    result1,
    result2,
    flag
  ) {
    console.log("UPDATING MATCH LOG");
    if (flag) {
      var message = new MessageEmbed()
        .setColor("#ff5722")
        .setTitle("--[MATCH LOG]--")
        .setDescription(
          "Match log initiated for " + team_a.name + " VS " + team_b.name
        )
        .setURL(match.faceit_url)
        .setThumbnail(teamWon.avatar)
        .setTimestamp()
        .addFields(
          { name: "Current Result:", value: "\u200B" },
          { name: team_a.name, value: result1.toString(), inline: true },
          { name: "VS", value: "\u200B", inline: true },
          { name: team_b.name, value: result2.toString(), inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "match-id", value: match.match_id },
          { name: "region", value: match.region }
        );
    } else
      var message = new MessageEmbed()
        .setColor("#ff5722")
        .setTitle("--[MATCH LOG]--")
        .setDescription("**" + teamWon.name + "**" + " won a round.")
        .setURL(match.faceit_url)
        .setThumbnail(teamWon.avatar)
        .setTimestamp()
        .addFields(
          { name: "New Result:", value: "\u200B" },
          { name: team_a.name, value: result1.toString(), inline: true },
          { name: "VS", value: "\u200B", inline: true },
          { name: team_b.name, value: result2.toString(), inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "match-id", value: match.match_id },
          { name: "region", value: match.region }
        );
      interaction.client.channels.cache.get(channel.id).send({ embeds: [message] });
  }

  static async deleteChannels(interaction,team_a_channel,team_b_channel,category,matchlog_channel){
    await interaction.guild.channels.cache.get(matchlog_channel.id).delete();
    await interaction.guild.channels.cache.get(team_a_channel.id).delete();
    await interaction.guild.channels.cache.get(team_b_channel.id).delete();
    await interaction.guild.channels.cache.get(category.id).delete();
  }

  static async movePlayers(
    match,
    team_a,
    team_b,
    team_a_channel,
    team_b_channel,
    interaction,
    flag
  ) {
    var team_a_discordIDs = [];
    var team_b_discordIDs = [];
    for (var player of team_a.roster) {
      //fetching A
      var db_user = await DBUser.getByFaceitId(player.player_id);
      if (db_user != undefined) team_a_discordIDs.push(db_user.discordId);
      else if (flag)
        logChannel(interaction.client).send({
          embeds: [
            new MessageEmbed()
              .setColor("#ff5722")
              .setTitle("[ADMIN ALERT | MATCH " + match.match_id + " ]")
              .setDescription(
                "Player " + player.nickname + " not synced on discord"
              )
              .setURL("https://www.faceit.com/en/players/" + player.nickname),
          ],
        });
    }
    for (var player of team_b.roster) {
      var db_user = await DBUser.getByFaceitId(player.player_id);
      if (db_user != undefined) team_b_discordIDs.push(db_user.discordId);
      else if (flag)
        logChannel(interaction.client).send({
          embeds: [
            new MessageEmbed()
              .setColor("#ff5722")
              .setTitle("[ADMIN ALERT | MATCH " + match.match_id + " ]")
              .setDescription(
                "Player " + player.nickname + " not synced on discord"
              )
              .setURL("https://www.faceit.com/en/players/" + player.nickname),
          ],
        });
    }

    for (var id of team_a_discordIDs) {
      try{
      var member = await team_a_channel.guild.members.cache.get(id);
      await member.voice.setChannel(team_a_channel);
    }catch(e){
      continue;
    }
    }
    for (var id of team_b_discordIDs) {
      try{
      var member = await team_b_channel.guild.members.cache.get(id);
      await member.voice.setChannel(team_b_channel);
      }catch(e){
        continue;
      }
    }
  }
}

module.exports = { HubThread };
