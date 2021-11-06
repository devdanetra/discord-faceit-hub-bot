const { default: axios } = require("axios");
const { steamApiToken } = require("../config.json");

class SteamUser {
  static endpoint = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/";

  static getById = async function (steamId) {
    const response = await axios
      .get(SteamUser.endpoint, {
        params: {
          steamids: steamId,
          key: steamApiToken,
        },
      })
      .catch(function (error) {
        return;
      });
    var result = new SteamUser();
    Object.assign(result, response.data["response"]["players"][0]);
    console.log(result);
    return result;
  };
}

module.exports = { SteamUser };
