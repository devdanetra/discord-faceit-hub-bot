const { FaceitMatch } = require("../faceit_consumer/match");
const { MessageEmbed } = require("discord.js");
const { DBUser } = require("../db_modules/users");
const { logChannel, getMainChannel } = require("../helper/generalFetcher");
const { HubThread } = require("./hub");
const { threadId } = require("worker_threads");

class MatchThread{

    constructor(match,updateTimeout,moveTimeout,interaction){
        this.match = match;
        this.updateTimeout = updateTimeout;
        this.moveTimeout = moveTimeout;
        this.interaction = interaction
    }

    delete = false;
    team_a = null;
    team_b = null;
    moveInterval = null;
    scoreUpdateInterval = null; 
    category = null;
    team_a_channel = null;
    team_b_channel = null;
    names_unavailable = true;
    teams_unavailable = true;
    move_flag = true;
    result1;
    result2;
    prevResult1 = " ";
    prevResult2 = " ";

    async stop(){
      this.stopMoving();
      this.stopScoreUpdate();
      this.deleteChannels();
      this.delete = true;
    }


    async start(){
        console.log("NEW MATCH");
        console.log(this.match);
        this.team_a = this.match.teams.faction1;
        this.team_b = this.match.teams.faction2;
        this.teams_unavailable = match.status == "CHECK_IN" ||match.status == "VOTING" || match.status == "CONFIGURING";
        this.names_unavailable = (this.match.status == "CHECK_IN " || this.match.status == "VOTING") ? true : false;
        this.category = await this.interaction.guild.channels.create((this.names_unavailable ? "Team_A" : this.team_a.name) + " VS " + (this.names_unavailable ? "Team_B": this.team_b.name), {type: "GUILD_CATEGORY"});
        this.team_a_channel = await this.interaction.guild.channels.create(this.names_unavailable ? "Team_A": this.team_a.name, {type: "GUILD_VOICE", parent: this.category});
        this.team_b_channel = await this.interaction.guild.channels.create(this.names_unavailable ? "Team_B": this.team_b.name, {type: "GUILD_VOICE", parent: this.category});
        this.matchlog_channel = await this.interaction.guild.channels.create("MATCH LOG", {type: "GUILD_TEXT", parent: this.category});
        switch(this.match.status){
          case "CHECK_IN":
          case "READY":
            this.matchlog_channel.send({ embeds: [new MessageEmbed()
              .setColor('#ff5722')
              .setTitle("--[MATCH LOG]--")
              .setDescription("Match starting up... players are invited to join the server.")]});
        }
        //HubThread.matches.push(this.match.match_id);
    }


    async startMoving(){
      this.moveInterval = setInterval(async function () {
        if (!this.teams_unavailable) {
        try {
            this.team_a = this.match.teams.faction1;
            this.team_b = this.match.teams.faction2;
            await this.movePlayers();
            this.move_flag = false;
        } catch (e) {
          return logChannel(this.interaction.client).send({
            embeds: [
              new MessageEmbed()
                .setColor("#ff5722")
                .setTitle("[ADMIN ALERT | SCRIPT ERROR ]")
                  .setDescription(e.toString()),
              ],
            });
        }
        }
      }, 5000);
      }

    stopMoving(){
        if(this.moveInterval != null)
          clearInterval(this.moveInterval);
    }

    startScoreUpdate(){
        this.scoreInterval = setInterval(this.updateScore, this.timeout);
    }


    async updateScore(){
        console.log(this.match);
        this.match = await FaceitMatch.getMatchByID(this.match.match_id);
        this.teams_unavailable = match.status == "CHECK_IN" ||match.status == "VOTING" || match.status == "CONFIGURING";
        this.names_unavailable = this.match.status == "CHECK_IN " || this.match.status == "VOTING" ? true : false;
        if(this.match.status == "FINISHED" || this.match.status == "CANCELLED"){
          return this.stop();
        }
        this.result1 = this.match.results == undefined ? " " : this.match.results.score.faction1; //updating result
        this.result2 = this.match.results == undefined ? " " : this.match.results.score.faction2;
        await this.team_a_channel.setName(this.result1 + " | " + (this.names_unavailable ? "Team_A": this.team_a.name));
        await this.team_b_channel.setName(this.result2 + " | " + (this.names_unavailable ? "Team_B": this.team_b.name));
        if(this.prevResult1 != this.result1 || this.prevResult2 != this.result2){
          await updateMatchLog();
        }
        this.prevResult1 = this.result1;
        this.prevResult2 = this.result2;

    }

    stopScoreUpdate(){
        if(this.scoreUpdateInterval != null)
            clearInterval(this.scoreUpdateInterval);
    }

    async updateMatchLog(){
        var teamWonRound = this.result1 > this.prevResult1 ? this.team_a : this.team_b;
        var message = new MessageEmbed()
          .setColor('#ff5722')
          .setTitle("--[MATCH LOG]--")
        .setDescription("**" + teamWonRound.name + "**" + " won a round.")
        .setURL(this.match.faceit_url)
          .setThumbnail(teamWonRound.avatar)
        .setTimestamp()
           .addFields(
          { name: 'New Result:',value: "\u200B"},
          { name: this.team_a.name, value: this.result1.toString(), inline: true},
          { name: "VS", value: "\u200B", inline: true},
              { name: this.team_b.name, value: this.result2.toString(), inline: true},
          { name: '\u200B', value: '\u200B'},
              { name: 'match-id', value: this.match.match_id},
              { name: 'region', value: this.match.region},
        );
        this.matchlog_channel.send({ embeds: [message] });
      }

      async movePlayers(
        ) {
        var team_a_discordIDs = [];
        var team_b_discordIDs = [];
        for (var player of this.team_a.roster) {
          //fetching A
          var db_user = await DBUser.getByFaceitId(player.player_id);
          if (db_user != undefined) team_a_discordIDs.push(db_user.discordId);
          else if (this.move_flag)
            logChannel(this.interaction.client).send({
              embeds: [
                new MessageEmbed()
                  .setColor("#ff5722")
                  .setTitle("[ADMIN ALERT | MATCH " + this.match.match_id + " ]")
                  .setDescription(
                    "Player " + player.nickname + " not synced on discord"
                  )
                  .setURL("https://www.faceit.com/en/players/" + player.nickname),
              ],
            });
        }
        for (var player of this.team_b.roster) {
          var db_user = await DBUser.getByFaceitId(player.player_id);
          if (db_user != undefined) team_b_discordIDs.push(db_user.discordId);
          else if (this.move_flag)
            logChannel(this.interaction.client).send({
              embeds: [
                new MessageEmbed()
                  .setColor("#ff5722")
                  .setTitle("[ADMIN ALERT | MATCH " + this.match.match_id + " ]")
                  .setDescription(
                    "Player " + player.nickname + " not synced on discord"
                  )
                  .setURL("https://www.faceit.com/en/players/" + player.nickname),
              ],
            });
        }
    
        for (var id of team_a_discordIDs) {
          try{
          var member = await this.team_a_channel.guild.members.cache.get(id);
          await member.voice.setChannel(this.team_a_channel);
        }catch(e){
          continue;
        }
        }
        for (var id of team_b_discordIDs) {
          try{
          var member = await this.team_b_channel.guild.members.cache.get(id);
          await this.member.voice.setChannel(this.team_b_channel);
          }catch(e){
            continue;
          }
        }
      }

      async deleteChannels(){
        await this.interaction.guild.channels.cache.get(this.matchlog_channel.id).delete();
        await this.interaction.guild.channels.cache.get(this.team_a_channel.id).delete();
        await this.interaction.guild.channels.cache.get(this.team_b_channel.id).delete();
        await this.interaction.guild.channels.cache.get(this.category.id).delete();
      }
}

module.exports = { MatchThread };