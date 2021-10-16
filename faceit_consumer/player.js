const { default: axios } = require("axios");
const { apiSource, apiToken } = require("../config.json");

class FaceitPlayer {
  static endpoint = apiSource + "players";

  static getPlayerByNick = async function (nickname) {
    const response = await axios
      .get(FaceitPlayer.endpoint, {
        params: {
          nickname: nickname,
        },
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitPlayer();
    Object.assign(result, response.data);
    return result;
  };

  static getPlayerByCSGOID = async function (csgo_player_id) {
    const response = await axios
      .get(FaceitPlayer.endpoint, {
        params: {
          game: csgo,
          game_player_id: csgo_player_id,
        },
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return;
      });
    var result = new FaceitPlayer();
    Object.assign(result, response.data);
    return result;
  };
}

module.exports = { FaceitPlayer };
