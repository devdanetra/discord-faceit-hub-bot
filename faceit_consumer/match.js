const { default: axios } = require("axios");
const { apiSource, apiToken } = require("../config.json");

class FaceitMatch {
  constructor(
    match_id,
    version,
    game,
    region,
    competition_id,
    competition_type,
    competition_name,
    organizer_id,
    teams,
    started_at,
    finished_at,
    demo_url,
    chat_room_id,
    best_of,
    results,
    status,
    faceit_url
  ) {
    this.match_id = match_id;
    this.version = version;
    this.game = game;
    this.region = region;
    this.competition_id = competition_id;
    this.competition_type = competition_type;
    this.competition_name = competition_name;
    this.organizer_id = organizer_id;
    this.teams = teams;
    this.started_at = started_at;
    this.finished_at = finished_at;
    this.demo_url = demo_url;
    this.chat_room_id = chat_room_id;
    this.best_of = best_of;
    this.results = results;
    this.status = status;
    this.faceit_url = faceit_url;
  }

  static endpoint = apiSource + "matches";

  static getMatchByID = async function (matchID) {
    const response = await axios
      .get(FaceitMatch.endpoint + "/" + matchID, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitMatch();
    Object.assign(result, response.data);
    return result;
  };
}

module.exports = { FaceitMatch };
