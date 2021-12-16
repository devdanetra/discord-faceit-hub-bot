const { FaceitHub } = require("../faceit_consumer/hub");
const { hubId, hubAutomationUpdateTime } = require("../config.json");
const { MatchThread } = require("./match");

class HubThread {
  static logtag = "[HUB]";
  static hub = null;
  static runningMatchesIds = [];
  static status = 0; //0 stop | 1 start | -1 error
  static interval;
  static matchThreads = [];

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

      matchesToGen = matches.filter(function (match) {
        //removing matches with running thread
        return HubThread.runningMatchesIds.indexOf(match.match_id) < 0;
      });

      for (var match of matches) {
        await matchThreads.push(new MatchThread(match,10000,5000,interaction));
        HubThread.runningMatchesIds.push(match.match_id);
      }
      for(var thread in HubThread.matchThreads){
        if(thread.delete){
          HubThread.matchThreads.splice(HubThread.matchThreads.indexOf(thread),1);
          HubThread.runningMatchesIds.splice(HubThread.matchThreads.indexOf(thread.match.match_id),1);
        }
      }
    }, hubAutomationUpdateTime);
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
}

module.exports = { HubThread };
