const { default: axios } = require("axios");
const { apiSource, apiToken } = require("../config.json");
const { FaceitMatch } = require("./match");

class FaceitHub {
  static endpoint = apiSource + "hubs";

  static getHubByID = async function (hubID) {
    const response = await axios
      .get(FaceitHub.endpoint + "/" + hubID, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitHub();
    Object.assign(result, response.data);
    return result;
  };

  getMatches = async function (type, offset, limit) {
    const response = await axios
      .get(FaceitHub.endpoint + "/" + this.hub_id + "/matches", {
        params: {
          type: type,
          offset: offset,
          limit: limit,
        },
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var matches = new Array();
    response.data.items.forEach((element) => {
      var temp = new FaceitMatch();
      matches.push(Object.assign(temp, element));
    });
    return matches;
  };

  getMatchByID = async function (type, offset, limit) {
    const response = await axios
      .get(FaceitHub.endpoint + "/" + this.hub_id + "/matches", { //TODO ADJUST THIS
        params: {
          type: type,
          offset: offset,
          limit: limit,
        },
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitMatch();
    Object.assign(result, response.data);
    console.log(result);
    return result;
  };

  getRules = async function (type, offset, limit) {
    const response = await axios
      .get(FaceitHub.endpoint + "/" + this.hub_id + "/rules", {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitHubRules();
    Object.assign(result, response.data);
    return result;
  };
}

class FaceitHubRules {
  constructor(rule_id, game, organizer, name, body) {
    this.rule_id = rule_id;
    this.game = game;
    this.organizer = organizer;
    this.name = name;
    this.body = body;
  }
}

module.exports = { FaceitHub };
