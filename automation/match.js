
class MatchThread{

    constructor(match,updateTimeout,moveTimeout,interaction){
        this.match = match;
        this.updateTimeout = updateTimeout;
        this.moveTimeout = moveTimeout;
        this.interaction = interaction
    }

    team_a = null;
    team_b = null;
    moveInterval = null;
    scoreUpdateInterval = null; 
    category = null;
    team_a_channel = null;
    team_b_channel = null;
    names_unavailable = true;
    result1;
    result2;
    prevResult1 = " ";
    prevResult2 = " ";


    async startThread(){
        console.log("NEW MATCH");
        console.log(this.match);
        this.team_a = this.match.teams.faction1;
        this.team_b = this.match.teams.faction2;
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
        this.names_unavailable = this.match.status == "CHECK_IN " || this.match.status == "VOTING" ? true : false;
        if(this.match.status == "FINISHED" || this.match.status == "CANCELLED"){
          await this.category.delete();
          await this.matchlog_channel.delete();
          await this.team_a_channel.delete();
          await this.team_b_channel.delete();
          return;
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

}